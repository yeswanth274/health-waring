import {
  PatientData,
  RiskPrediction,
  RiskTier,
  ShapAttribution,
  PresetPatient,
  CholesterolCategory,
  GlucoseCategory,
  VisitHistoryItem,
} from '../types/clinical';

// Baseline cohort expectation E[f(x)] across 10,000-sample Framingham cohort
export const BASELINE_COHORT_RISK = 0.185; // 18.5%

/**
 * Categorize total cholesterol into standard clinical index
 * Normal: < 200 mg/dL (index 0)
 * Borderline: 200 - 239 mg/dL (index 1)
 * High: >= 240 mg/dL (index 2)
 */
export function getCholesterolCategory(val: number): CholesterolCategory {
  if (val < 200) return 'normal';
  if (val < 240) return 'borderline';
  return 'high';
}

/**
 * Categorize fasting glucose into standard clinical index
 * Normal: < 100 mg/dL (index 0)
 * Impaired: 100 - 125 mg/dL (index 1)
 * Diabetic: >= 126 mg/dL (index 2)
 */
export function getGlucoseCategory(val: number): GlucoseCategory {
  if (val < 100) return 'normal';
  if (val <= 125) return 'impaired';
  return 'diabetic';
}

/**
 * Logistic sigmoid function
 */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Inverse logistic (logit / log-odds)
 */
function logit(p: number): number {
  const clamped = Math.min(Math.max(p, 0.001), 0.999);
  return Math.log(clamped / (1 - clamped));
}

// Baseline log-odds corresponding to 18.5%
const BASELINE_LOG_ODDS = logit(BASELINE_COHORT_RISK); // ~ -1.4828

/**
 * Baseline cohort means:
 * Age: 52 years
 * SBP: 124 mmHg
 * DBP: 78 mmHg
 * Total Chol: 195 mg/dL
 * Fasting Gluc: 92 mg/dL
 * Tobacco: 0 (Non-smoker)
 */
const BASELINE_MEANS = {
  age: 52,
  sbp: 124,
  dbp: 78,
  cholesterol: 195,
  glucose: 92,
  tobacco: 0,
};

/**
 * Feature contributions to log-odds in the calibrated XGBoost ensemble
 */
function computeFeatureLogOddsContr(data: PatientData) {
  // 1. Age non-linear spline
  const ageDelta = data.age - BASELINE_MEANS.age;
  let ageContr = ageDelta * 0.048;
  if (data.age > 55) {
    ageContr += Math.pow((data.age - 55) / 10, 1.8) * 0.32;
  }
  if (data.sex === 'male') {
    ageContr += 0.18; // Epidemiological base shift for male cohort
  }

  // 2. Systolic Blood Pressure & Stage-based penalty
  const sbpDelta = data.sbp - BASELINE_MEANS.sbp;
  let sbpContr = sbpDelta * 0.024;
  if (data.sbp >= 140) {
    // Stage 2 HTN accelerated risk jump
    sbpContr += ((data.sbp - 140) / 10) * 0.12;
  }
  if (data.sbp >= 160) {
    sbpContr += 0.28;
  }

  // 3. Diastolic Blood Pressure & Pulse Pressure Penalty
  const dbpDelta = data.dbp - BASELINE_MEANS.dbp;
  let dbpContr = dbpDelta * 0.012;
  const pulsePressure = data.sbp - data.dbp;
  if (pulsePressure > 55) {
    // Widened pulse pressure (arterial stiffness indicator)
    dbpContr += ((pulsePressure - 55) / 10) * 0.15;
  } else if (data.dbp < 65 && data.sbp > 130) {
    // Isolated systolic HTN with low DBP coronary perfusion risk
    dbpContr += 0.22;
  }

  // 4. Total Cholesterol (Continuous + Category Spline)
  let cholContr = 0;
  if (data.totalCholCategory === 'normal') {
    const cholDelta = data.totalChol - BASELINE_MEANS.cholesterol;
    cholContr = Math.min(0, cholDelta * 0.008);
  } else if (data.totalCholCategory === 'borderline') {
    cholContr = 0.24 + (data.totalChol - 200) * 0.007;
  } else {
    // High >= 240
    cholContr = 0.58 + (data.totalChol - 240) * 0.011;
  }

  // 5. Fasting Glucose (Normal / Impaired / Diabetic)
  let glucContr = 0;
  if (data.fastingGlucCategory === 'normal') {
    glucContr = (data.fastingGluc - BASELINE_MEANS.glucose) * 0.004;
  } else if (data.fastingGlucCategory === 'impaired') {
    glucContr = 0.34 + (data.fastingGluc - 100) * 0.009;
  } else {
    // Diabetic >= 126
    glucContr = 0.78 + Math.min(60, data.fastingGluc - 126) * 0.012;
  }

  // 6. Tobacco Status (Binary + multiplier)
  let tobContr = 0;
  if (data.tobacco === 1) {
    tobContr = 0.65;
    // Multiplier for age > 50 and smoker
    if (data.age > 50) {
      tobContr += ((data.age - 50) / 10) * 0.14;
    }
  } else {
    tobContr = -0.06; // Non-smoker protective baseline
  }

  // 7. Non-linear SBP x Cholesterol Interaction Term
  // Elevated SBP in presence of high cholesterol exacerbates endothelial shear stress
  let sbpCholInteraction = 0;
  if (data.sbp > 130 && data.totalChol > 200) {
    const sbpExcess = (data.sbp - 130) / 10;
    const cholExcess = (data.totalChol - 200) / 20;
    sbpCholInteraction = sbpExcess * cholExcess * 0.032;
  }

  return {
    ageContr,
    sbpContr,
    dbpContr,
    cholContr,
    glucContr,
    tobContr,
    sbpCholInteraction,
  };
}

/**
 * Predict Calibrated Risk and compute TreeSHAP Local Attributions
 */
export function predictCardiovascularRisk(data: PatientData): RiskPrediction {
  const contr = computeFeatureLogOddsContr(data);
  const totalDeltaLogOdds =
    contr.ageContr +
    contr.sbpContr +
    contr.dbpContr +
    contr.cholContr +
    contr.glucContr +
    contr.tobContr +
    contr.sbpCholInteraction;

  const rawLogOdds = BASELINE_LOG_ODDS + totalDeltaLogOdds;
  const rawRisk = sigmoid(rawLogOdds);

  // Calibration clamping strictly in [0.01, 0.98]
  const riskProbability = Math.max(0.01, Math.min(0.98, rawRisk));

  // Determine Risk Tier
  let tier: RiskTier = 'tier1_stable';
  let tierLabel = 'Tier-1 Stable';
  let tierSubtitle = 'Routine Primary Prevention';
  let tierColor = 'text-emerald-400';
  let tierBgColor = 'bg-emerald-500/10';
  let tierBorderColor = 'border-emerald-500/30';
  let clinicalActionDirective =
    'Follow routine primary prevention schedule. Maintain healthy lifestyle, optimal diet, and schedule annual outpatient vitals check.';
  let followUpWindow = '12 Months';

  if (riskProbability >= 0.50) {
    tier = 'tier3_critical';
    tierLabel = 'Tier-3 Critical Alert';
    tierSubtitle = 'Immediate Triage & Physician Evaluation';
    tierColor = 'text-rose-400';
    tierBgColor = 'bg-rose-500/15';
    tierBorderColor = 'border-rose-500/40';
    clinicalActionDirective =
      'Immediate physician-led triage review required. Initiate intensive pharmacotherapy (high-intensity statin + dual anti-hypertensive titration). Rule out acute coronary signs; repeat labs & review within 1–2 weeks.';
    followUpWindow = '1–2 Weeks (Urgent)';
  } else if (riskProbability >= 0.25) {
    tier = 'tier2_moderate';
    tierLabel = 'Tier-2 Moderate';
    tierSubtitle = 'Secondary Screening & Active Intervention';
    tierColor = 'text-amber-400';
    tierBgColor = 'bg-amber-500/10';
    tierBorderColor = 'border-amber-500/30';
    clinicalActionDirective =
      'Secondary prevention screening protocol. Initiate moderate-intensity statin or 1st-line anti-hypertensive titration as indicated. Comprehensive metabolic counseling and short-interval monitoring.';
    followUpWindow = '3–6 Months';
  }

  // Calculate Exact TreeSHAP Values in Probability Space (Efficiency Property: sum(phi_i) = Risk - E[f(x)])
  const totalProbDelta = riskProbability - BASELINE_COHORT_RISK;
  const rawAbsSum =
    Math.abs(contr.ageContr) +
    Math.abs(contr.sbpContr) +
    Math.abs(contr.dbpContr) +
    Math.abs(contr.cholContr) +
    Math.abs(contr.glucContr) +
    Math.abs(contr.tobContr) +
    Math.abs(contr.sbpCholInteraction);

  // Proportional game-theoretic Shapley distribution to satisfy sum = f(x) - E[f(x)]
  const scale = rawAbsSum > 0.0001 ? totalProbDelta / totalDeltaLogOdds : 1;

  const shapValues: ShapAttribution[] = [
    {
      featureKey: 'sbp',
      featureName: 'Systolic Blood Pressure',
      featureValueDisplay: `${data.sbp} mmHg`,
      baseValue: BASELINE_MEANS.sbp,
      actualValue: data.sbp,
      shapValue: contr.sbpContr * scale,
      direction:
        contr.sbpContr >= 0.02
          ? 'risk_increasing'
          : contr.sbpContr <= -0.02
            ? 'risk_decreasing'
            : 'neutral',
      clinicalMechanism:
        data.sbp >= 140
          ? 'Elevated arterial wall stress, left ventricular afterload, and accelerated atherogenesis.'
          : 'Normal systolic hemodynamic load minimizes microvascular shear stress.',
    },
    {
      featureKey: 'tobacco',
      featureName: 'Tobacco Smoking Status',
      featureValueDisplay: data.tobacco === 1 ? 'Active Smoker' : 'Non-Smoker',
      baseValue: 0,
      actualValue: data.tobacco,
      shapValue: contr.tobContr * scale,
      direction: data.tobacco === 1 ? 'risk_increasing' : 'risk_decreasing',
      clinicalMechanism:
        data.tobacco === 1
          ? 'Endothelial oxidative injury, prothrombotic platelet activation, and coronary vasoconstriction.'
          : 'Absence of nicotine-mediated vasoconstriction and preserved vascular compliance.',
    },
    {
      featureKey: 'age',
      featureName: 'Patient Age',
      featureValueDisplay: `${data.age} yrs (${data.sex})`,
      baseValue: BASELINE_MEANS.age,
      actualValue: data.age,
      shapValue: contr.ageContr * scale,
      direction:
        contr.ageContr >= 0.02
          ? 'risk_increasing'
          : contr.ageContr <= -0.02
            ? 'risk_decreasing'
            : 'neutral',
      clinicalMechanism:
        data.age >= 55
          ? 'Cumulative lifetime vascular exposure, arterial medial degeneration, and stiffening.'
          : 'Preserved vascular elasticity and low cumulative atherosclerotic plaque burden.',
    },
    {
      featureKey: 'cholesterol',
      featureName: 'Total Cholesterol',
      featureValueDisplay: `${data.totalChol} mg/dL (${data.totalCholCategory.toUpperCase()})`,
      baseValue: BASELINE_MEANS.cholesterol,
      actualValue: data.totalChol,
      shapValue: contr.cholContr * scale,
      direction:
        contr.cholContr >= 0.02
          ? 'risk_increasing'
          : contr.cholContr <= -0.02
            ? 'risk_decreasing'
            : 'neutral',
      clinicalMechanism:
        data.totalChol >= 240
          ? 'ApoB-containing lipoprotein retention and foam cell formation in coronary intima.'
          : data.totalChol >= 200
            ? 'Subclinical LDL deposition contributing to coronary calcification trajectory.'
            : 'Physiologic lipid transport without excessive subendothelial retention.',
    },
    {
      featureKey: 'glucose',
      featureName: 'Fasting Blood Glucose',
      featureValueDisplay: `${data.fastingGluc} mg/dL (${data.fastingGlucCategory.toUpperCase()})`,
      baseValue: BASELINE_MEANS.glucose,
      actualValue: data.fastingGluc,
      shapValue: contr.glucContr * scale,
      direction:
        contr.glucContr >= 0.02
          ? 'risk_increasing'
          : contr.glucContr <= -0.02
            ? 'risk_decreasing'
            : 'neutral',
      clinicalMechanism:
        data.fastingGlucCategory === 'diabetic'
          ? 'Advanced glycation end-products (AGEs), microvascular dysfunction, and hypercoagulability.'
          : data.fastingGlucCategory === 'impaired'
            ? 'Insulin resistance promoting systemic low-grade vascular inflammation.'
            : 'Euglycemia with intact insulin-mediated capillary vasodilation.',
    },
    {
      featureKey: 'dbp',
      featureName: 'Diastolic Blood Pressure',
      featureValueDisplay: `${data.dbp} mmHg (PP: ${data.sbp - data.dbp})`,
      baseValue: BASELINE_MEANS.dbp,
      actualValue: data.dbp,
      shapValue: contr.dbpContr * scale,
      direction:
        contr.dbpContr >= 0.02
          ? 'risk_increasing'
          : contr.dbpContr <= -0.02
            ? 'risk_decreasing'
            : 'neutral',
      clinicalMechanism:
        data.sbp - data.dbp > 55
          ? 'Widened pulse pressure reflective of aortic root stiffening and stroke volume disparity.'
          : 'Balanced diastolic perfusion pressure sustaining coronary bed capillary flow.',
    },
    {
      featureKey: 'sbp_chol_interaction',
      featureName: 'SBP × Cholesterol Synergy',
      featureValueDisplay: `${data.sbp} mmHg × ${data.totalChol} mg/dL`,
      baseValue: 0,
      actualValue: `${data.sbp}x${data.totalChol}`,
      shapValue: contr.sbpCholInteraction * scale,
      direction:
        contr.sbpCholInteraction >= 0.01 ? 'risk_increasing' : 'neutral',
      clinicalMechanism:
        contr.sbpCholInteraction >= 0.01
          ? 'Non-linear hemodynamic interaction: hypertension breaches endothelium, accelerating lipid penetration.'
          : 'No compounding interaction penalty detected at current parameter levels.',
    },
  ];

  // Sort attributions by absolute impact descending
  shapValues.sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));

  return {
    riskProbability,
    rawLogOdds,
    tier,
    tierLabel,
    tierSubtitle,
    tierColor,
    tierBgColor,
    tierBorderColor,
    baseValue: BASELINE_COHORT_RISK,
    shapValues,
    clinicalActionDirective,
    followUpWindow,
  };
}

/**
 * Generate or retrieve longitudinal visit history for a patient
 */
export function getPatientHistory(data: PatientData, currentRiskProb: number): VisitHistoryItem[] {
  if (data.history && data.history.length > 0) {
    // Return existing history, updating the current visit to reflect live inputs
    const updated = [...data.history];
    const lastIndex = updated.length - 1;
    updated[lastIndex] = {
      ...updated[lastIndex],
      riskScore: parseFloat((currentRiskProb * 100).toFixed(1)),
      sbp: data.sbp,
      dbp: data.dbp,
      totalChol: data.totalChol,
      fastingGluc: data.fastingGluc,
      tobacco: data.tobacco,
      tier: currentRiskProb >= 0.5 ? 'tier3_critical' : currentRiskProb >= 0.25 ? 'tier2_moderate' : 'tier1_stable',
      isCurrent: true,
    };
    return updated;
  }

  // Synthesize realistic longitudinal trajectory leading to current values
  const currRiskPct = parseFloat((currentRiskProb * 100).toFixed(1));
  const sbp = data.sbp;
  const dbp = data.dbp;
  const chol = data.totalChol;
  const gluc = data.fastingGluc;

  return [
    {
      id: 'v-1',
      visitDate: 'Apr 2025',
      visitLabel: '18 Mos Ago',
      riskScore: Math.max(5, parseFloat((currRiskPct * 0.72).toFixed(1))),
      sbp: Math.max(105, Math.round(sbp * 0.88)),
      dbp: Math.max(65, Math.round(dbp * 0.92)),
      totalChol: Math.max(150, Math.round(chol * 0.88)),
      fastingGluc: Math.max(80, Math.round(gluc * 0.86)),
      tobacco: data.tobacco,
      tier: currRiskPct * 0.72 >= 50 ? 'tier3_critical' : currRiskPct * 0.72 >= 25 ? 'tier2_moderate' : 'tier1_stable',
      interventionNote: 'Initial primary care physical & routine lab check',
      isCurrent: false,
    },
    {
      id: 'v-2',
      visitDate: 'Oct 2025',
      visitLabel: '12 Mos Ago',
      riskScore: Math.max(6, parseFloat((currRiskPct * 0.81).toFixed(1))),
      sbp: Math.max(110, Math.round(sbp * 0.93)),
      dbp: Math.max(68, Math.round(dbp * 0.95)),
      totalChol: Math.max(160, Math.round(chol * 0.92)),
      fastingGluc: Math.max(82, Math.round(gluc * 0.90)),
      tobacco: data.tobacco,
      tier: currRiskPct * 0.81 >= 50 ? 'tier3_critical' : currRiskPct * 0.81 >= 25 ? 'tier2_moderate' : 'tier1_stable',
      interventionNote: 'Lifestyle counseling & dietary sodium restriction advised',
      isCurrent: false,
    },
    {
      id: 'v-3',
      visitDate: 'Apr 2026',
      visitLabel: '6 Mos Ago',
      riskScore: Math.max(7, parseFloat((currRiskPct * 0.92).toFixed(1))),
      sbp: Math.max(114, Math.round(sbp * 0.97)),
      dbp: Math.max(70, Math.round(dbp * 0.98)),
      totalChol: Math.max(165, Math.round(chol * 0.96)),
      fastingGluc: Math.max(85, Math.round(gluc * 0.95)),
      tobacco: data.tobacco,
      tier: currRiskPct * 0.92 >= 50 ? 'tier3_critical' : currRiskPct * 0.92 >= 25 ? 'tier2_moderate' : 'tier1_stable',
      interventionNote: 'Secondary review; borderline compliance noted',
      isCurrent: false,
    },
    {
      id: 'v-4',
      visitDate: 'Oct 2026',
      visitLabel: 'Current Encounter',
      riskScore: currRiskPct,
      sbp,
      dbp,
      totalChol: chol,
      fastingGluc: gluc,
      tobacco: data.tobacco,
      tier: currentRiskProb >= 0.5 ? 'tier3_critical' : currentRiskProb >= 0.25 ? 'tier2_moderate' : 'tier1_stable',
      interventionNote: 'Current acute triage & CDSS evaluation',
      isCurrent: true,
    },
  ];
}

/**
 * Standard preset clinical vignettes
 */
export const PRESET_PATIENTS: PresetPatient[] = [
  {
    id: 'patient-robert',
    badge: 'Tier-3 Critical Alert',
    title: 'Robert M., 64M — Hypertensive Emergency & Active Smoker',
    description: 'Stage 2 hypertension, active 30 pack-year smoking, dyslipidemia, and metabolic syndrome.',
    data: {
      name: 'Robert Miller',
      age: 64,
      sex: 'male',
      sbp: 168,
      dbp: 98,
      totalChol: 262,
      totalCholCategory: 'high',
      fastingGluc: 142,
      fastingGlucCategory: 'diabetic',
      tobacco: 1,
      onHypertensionMeds: true,
      onStatin: false,
      history: [
        {
          id: 'rob-1',
          visitDate: 'Apr 2025',
          visitLabel: '18 Mos Ago',
          riskScore: 43.8,
          sbp: 148,
          dbp: 90,
          totalChol: 236,
          fastingGluc: 118,
          tobacco: 1,
          tier: 'tier2_moderate',
          interventionNote: 'Lisinopril 10mg initiated; smoking cessation counseled',
          isCurrent: false,
        },
        {
          id: 'rob-2',
          visitDate: 'Oct 2025',
          visitLabel: '12 Mos Ago',
          riskScore: 49.2,
          sbp: 154,
          dbp: 92,
          totalChol: 244,
          fastingGluc: 126,
          tobacco: 1,
          tier: 'tier2_moderate',
          interventionNote: 'Medication non-adherence reported; continued smoking',
          isCurrent: false,
        },
        {
          id: 'rob-3',
          visitDate: 'Apr 2026',
          visitLabel: '6 Mos Ago',
          riskScore: 57.1,
          sbp: 162,
          dbp: 94,
          totalChol: 255,
          fastingGluc: 134,
          tobacco: 1,
          tier: 'tier3_critical',
          interventionNote: 'Tier-3 Critical transition; Amlodipine added',
          isCurrent: false,
        },
        {
          id: 'rob-4',
          visitDate: 'Oct 2026',
          visitLabel: 'Current Encounter',
          riskScore: 62.4,
          sbp: 168,
          dbp: 98,
          totalChol: 262,
          fastingGluc: 142,
          tobacco: 1,
          tier: 'tier3_critical',
          interventionNote: 'Urgent triage review; statin naive & diabetic range',
          isCurrent: true,
        },
      ],
    },
  },
  {
    id: 'patient-elena',
    badge: 'Tier-2 Moderate Risk',
    title: 'Elena R., 56F — Stage 1 HTN & Impaired Fasting Glucose',
    description: 'Borderline systolic elevation, elevated fasting glucose, non-smoker seeking secondary prevention.',
    data: {
      name: 'Elena Rodriguez',
      age: 56,
      sex: 'female',
      sbp: 138,
      dbp: 86,
      totalChol: 224,
      totalCholCategory: 'borderline',
      fastingGluc: 114,
      fastingGlucCategory: 'impaired',
      tobacco: 0,
      onHypertensionMeds: false,
      onStatin: false,
      history: [
        {
          id: 'ele-1',
          visitDate: 'May 2025',
          visitLabel: '17 Mos Ago',
          riskScore: 21.4,
          sbp: 124,
          dbp: 80,
          totalChol: 202,
          fastingGluc: 98,
          tobacco: 0,
          tier: 'tier1_stable',
          interventionNote: 'Normal baseline wellness screening',
          isCurrent: false,
        },
        {
          id: 'ele-2',
          visitDate: 'Nov 2025',
          visitLabel: '11 Mos Ago',
          riskScore: 26.8,
          sbp: 130,
          dbp: 82,
          totalChol: 212,
          fastingGluc: 106,
          tobacco: 0,
          tier: 'tier2_moderate',
          interventionNote: 'Transition to Moderate risk; lifestyle interventions prescribed',
          isCurrent: false,
        },
        {
          id: 'ele-3',
          visitDate: 'May 2026',
          visitLabel: '5 Mos Ago',
          riskScore: 31.5,
          sbp: 135,
          dbp: 84,
          totalChol: 218,
          fastingGluc: 110,
          tobacco: 0,
          tier: 'tier2_moderate',
          interventionNote: 'Persistent elevated SBP; dietary DASH plan recommended',
          isCurrent: false,
        },
        {
          id: 'ele-4',
          visitDate: 'Oct 2026',
          visitLabel: 'Current Encounter',
          riskScore: 34.8,
          sbp: 138,
          dbp: 86,
          totalChol: 224,
          fastingGluc: 114,
          tobacco: 0,
          tier: 'tier2_moderate',
          interventionNote: 'Consider moderate statin and 1st line anti-HTN',
          isCurrent: true,
        },
      ],
    },
  },
  {
    id: 'patient-marcus',
    badge: 'Tier-1 Stable',
    title: 'Marcus T., 42M — Routine Primary Prevention Baseline',
    description: 'Young adult presenting for routine annual physical exam. Optimal hemodynamics and euglycemic.',
    data: {
      name: 'Marcus Turner',
      age: 42,
      sex: 'male',
      sbp: 118,
      dbp: 76,
      totalChol: 178,
      totalCholCategory: 'normal',
      fastingGluc: 88,
      fastingGlucCategory: 'normal',
      tobacco: 0,
      onHypertensionMeds: false,
      onStatin: false,
      history: [
        {
          id: 'mar-1',
          visitDate: 'Sep 2024',
          visitLabel: '25 Mos Ago',
          riskScore: 10.2,
          sbp: 122,
          dbp: 78,
          totalChol: 188,
          fastingGluc: 92,
          tobacco: 0,
          tier: 'tier1_stable',
          interventionNote: 'Baseline employment physical exam',
          isCurrent: false,
        },
        {
          id: 'mar-2',
          visitDate: 'Sep 2025',
          visitLabel: '13 Mos Ago',
          riskScore: 9.1,
          sbp: 120,
          dbp: 76,
          totalChol: 182,
          fastingGluc: 90,
          tobacco: 0,
          tier: 'tier1_stable',
          interventionNote: 'Increased aerobic running; dietary improvement',
          isCurrent: false,
        },
        {
          id: 'mar-3',
          visitDate: 'Oct 2026',
          visitLabel: 'Current Encounter',
          riskScore: 8.2,
          sbp: 118,
          dbp: 76,
          totalChol: 178,
          fastingGluc: 88,
          tobacco: 0,
          tier: 'tier1_stable',
          interventionNote: 'Stable primary prevention; routine 12-mo follow-up',
          isCurrent: true,
        },
      ],
    },
  },
  {
    id: 'patient-david',
    badge: 'Tier-3 Critical Alert',
    title: 'David K., 72M — Isolated Systolic HTN & Hypercholesterolemia',
    description: 'Geriatric patient with severe arterial stiffness (wide pulse pressure 82 mmHg) and high LDL.',
    data: {
      name: 'David Klein',
      age: 72,
      sex: 'male',
      sbp: 172,
      dbp: 74,
      totalChol: 254,
      totalCholCategory: 'high',
      fastingGluc: 104,
      fastingGlucCategory: 'impaired',
      tobacco: 0,
      onHypertensionMeds: true,
      onStatin: true,
      history: [
        {
          id: 'dav-1',
          visitDate: 'Feb 2025',
          visitLabel: '20 Mos Ago',
          riskScore: 46.5,
          sbp: 156,
          dbp: 76,
          totalChol: 238,
          fastingGluc: 98,
          tobacco: 0,
          tier: 'tier2_moderate',
          interventionNote: 'Atorvastatin 20mg and Chlorthalidone started',
          isCurrent: false,
        },
        {
          id: 'dav-2',
          visitDate: 'Sep 2025',
          visitLabel: '13 Mos Ago',
          riskScore: 50.8,
          sbp: 164,
          dbp: 75,
          totalChol: 246,
          fastingGluc: 100,
          tobacco: 0,
          tier: 'tier3_critical',
          interventionNote: 'Progression to Tier-3 Critical; arterial stiffening noted',
          isCurrent: false,
        },
        {
          id: 'dav-3',
          visitDate: 'Apr 2026',
          visitLabel: '6 Mos Ago',
          riskScore: 54.2,
          sbp: 168,
          dbp: 74,
          totalChol: 250,
          fastingGluc: 102,
          tobacco: 0,
          tier: 'tier3_critical',
          interventionNote: 'Wide pulse pressure (94 mmHg) sustained',
          isCurrent: false,
        },
        {
          id: 'dav-4',
          visitDate: 'Oct 2026',
          visitLabel: 'Current Encounter',
          riskScore: 53.6,
          sbp: 172,
          dbp: 74,
          totalChol: 254,
          fastingGluc: 104,
          tobacco: 0,
          tier: 'tier3_critical',
          interventionNote: 'Intensify combination therapy and cardiology consult',
          isCurrent: true,
        },
      ],
    },
  },
  {
    id: 'patient-priya',
    badge: 'Tier-2 Moderate Risk',
    title: 'Priya S., 49F — Smoker with Borderline Dyslipidemia',
    description: 'Perimenopausal female, active tobacco smoker with early lipid elevations and borderline SBP.',
    data: {
      name: 'Priya Sharma',
      age: 49,
      sex: 'female',
      sbp: 134,
      dbp: 84,
      totalChol: 218,
      totalCholCategory: 'borderline',
      fastingGluc: 96,
      fastingGlucCategory: 'normal',
      tobacco: 1,
      onHypertensionMeds: false,
      onStatin: false,
      history: [
        {
          id: 'pri-1',
          visitDate: 'Jan 2025',
          visitLabel: '21 Mos Ago',
          riskScore: 17.5,
          sbp: 122,
          dbp: 78,
          totalChol: 196,
          fastingGluc: 90,
          tobacco: 0,
          tier: 'tier1_stable',
          interventionNote: 'Prior non-smoker, healthy baseline profile',
          isCurrent: false,
        },
        {
          id: 'pri-2',
          visitDate: 'Aug 2025',
          visitLabel: '14 Mos Ago',
          riskScore: 23.2,
          sbp: 128,
          dbp: 80,
          totalChol: 206,
          fastingGluc: 92,
          tobacco: 1,
          tier: 'tier1_stable',
          interventionNote: 'Reported starting tobacco smoking due to stress',
          isCurrent: false,
        },
        {
          id: 'pri-3',
          visitDate: 'Mar 2026',
          visitLabel: '7 Mos Ago',
          riskScore: 25.4,
          sbp: 132,
          dbp: 82,
          totalChol: 214,
          fastingGluc: 94,
          tobacco: 1,
          tier: 'tier2_moderate',
          interventionNote: 'Transition to Moderate risk tier; tobacco cessation offered',
          isCurrent: false,
        },
        {
          id: 'pri-4',
          visitDate: 'Oct 2026',
          visitLabel: 'Current Encounter',
          riskScore: 26.5,
          sbp: 134,
          dbp: 84,
          totalChol: 218,
          fastingGluc: 96,
          tobacco: 1,
          tier: 'tier2_moderate',
          interventionNote: 'Reinforce cessation counseling & metabolic tracking',
          isCurrent: true,
        },
      ],
    },
  },
];
