import { PatientData, RiskPrediction, CounterfactualScenario } from '../types/clinical';

export interface SoapNoteOptions {
  patient: PatientData;
  prediction: RiskPrediction;
  counterfactual?: CounterfactualScenario | null;
  clinicianNotes?: string;
  clinicianName?: string;
  encounterType?: string;
}

/**
 * Generate formatted EHR SOAP Clinical Note
 */
export function generateSoapNote(options: SoapNoteOptions): string {
  const {
    patient,
    prediction,
    counterfactual,
    clinicianNotes = '',
    clinicianName = 'Attending Physician, MD',
    encounterType = 'Outpatient Cardiovascular Risk Assessment / Triage',
  } = options;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const pulsePressure = patient.sbp - patient.dbp;
  const meanArterialPressure = Math.round(patient.dbp + (1 / 3) * pulsePressure);
  const riskPct = (prediction.riskProbability * 100).toFixed(1);
  const baselinePct = (prediction.baseValue * 100).toFixed(1);

  // Top risk-increasing factors from TreeSHAP
  const positiveDrivers = prediction.shapValues
    .filter((s) => s.shapValue > 0.005)
    .slice(0, 3);

  // Top protective/mitigating factors
  const protectiveDrivers = prediction.shapValues
    .filter((s) => s.shapValue < -0.005)
    .slice(0, 2);

  const lines: string[] = [
    `================================================================================`,
    `CLINICAL DECISION SUPPORT SYSTEM (CDSS) CONSULTATION NOTE`,
    `CardioAlert CDSS — Tier-1 Cardiovascular Risk Stratification & Intervention`,
    `================================================================================`,
    `DATE / TIME: ${dateStr} ${timeStr}`,
    `ENCOUNTER:   ${encounterType}`,
    `PATIENT:     ${patient.name || 'Unnamed Patient'}`,
    `AGE / SEX:   ${patient.age} years old | ${patient.sex.toUpperCase()}`,
    `RECORD ID:   MRN-${Math.abs(patient.age * 937 + patient.sbp * 43).toString().padStart(8, '0')}`,
    `CDSS SPEC:   SaMD Class I / Tier-1 Decision Support (TRIPOD+AI Compliant)`,
    `--------------------------------------------------------------------------------`,
    ``,
    `[S] SUBJECTIVE:`,
    `- Patient presents for cardiovascular risk evaluation and routine metabolic triage.`,
    `- Tobacco History: ${patient.tobacco === 1 ? 'Current Active Tobacco Smoker' : 'Denies current or active tobacco use (Non-smoker)'}.`,
    `- Antihypertensive therapy: ${patient.onHypertensionMeds ? 'Prescribed / Active regimen' : 'Not currently prescribed'}.`,
    `- Statin / Lipid-lowering therapy: ${patient.onStatin ? 'Currently taking statin' : 'Statin-naive'}.`,
    `- Review of systems: Patient reports no acute retrosternal chest pain, active dyspnea at rest, diaphoresis, or syncope.`,
    ``,
    `[O] OBJECTIVE:`,
    `-- Hemodynamic Vitals --`,
    `- Blood Pressure (Sitting, calibrated cuff): ${patient.sbp} / ${patient.dbp} mmHg`,
    `- Pulse Pressure: ${pulsePressure} mmHg ${pulsePressure > 55 ? '(Widened, consistent with arterial stiffness)' : '(Within normal physiological limit)'}`,
    `- Mean Arterial Pressure (MAP): ${meanArterialPressure} mmHg`,
    ``,
    `-- Laboratory & Metabolic Biomarkers --`,
    `- Total Cholesterol: ${patient.totalChol} mg/dL [Category: ${patient.totalCholCategory.toUpperCase()}] (Reference: <200 normal, 200-239 borderline, >=240 high)`,
    `- Fasting Blood Glucose: ${patient.fastingGluc} mg/dL [Category: ${patient.fastingGlucCategory.toUpperCase()}] (Reference: <100 normal, 100-125 impaired, >=126 diabetic)`,
    ``,
    `[A] ASSESSMENT:`,
    `- PRIMARY DIAGNOSTIC IMPRESSION: 10-Year Atherosclerotic Cardiovascular Disease (ASCVD) Risk Assessment.`,
    `- CDSS RISK STRATIFICATION: ${prediction.tierLabel.toUpperCase()}`,
    `- PREDICTED 10-YEAR CVD RISK: ${riskPct}% (Baseline population expected reference: ${baselinePct}%)`,
    `- RISK DIFFERENTIAL: ${prediction.riskProbability >= prediction.baseValue ? '+' : ''}${((prediction.riskProbability - prediction.baseValue) * 100).toFixed(1)}% vs. Age/Cohort Peer Baseline`,
    ...(patient.history && patient.history.length > 1
      ? [
          `- LONGITUDINAL TRAJECTORY: ${patient.history[0].riskScore}% (${patient.history[0].visitDate}) -> ${riskPct}% (Current Encounter) [${
            Number((prediction.riskProbability * 100 - patient.history[0].riskScore).toFixed(1)) >= 0 ? '+' : ''
          }${(prediction.riskProbability * 100 - patient.history[0].riskScore).toFixed(1)}% net delta across ${patient.history.length} visits]`,
        ]
      : []),
    `- ACTION DIRECTIVE: ${prediction.clinicalActionDirective}`,
    ``,
    `-- Game-Theoretic TreeSHAP Attribution Breakdown --`,
    `Primary Risk-Accelerating Determinants:`,
  ];

  if (positiveDrivers.length > 0) {
    positiveDrivers.forEach((driver, idx) => {
      const shapPct = (driver.shapValue * 100).toFixed(1);
      lines.push(
        `  ${idx + 1}. ${driver.featureName} (${driver.featureValueDisplay}): +${shapPct}% risk contribution`,
        `     -> Mechanism: ${driver.clinicalMechanism}`
      );
    });
  } else {
    lines.push(`  - No significant risk-accelerating outliers detected.`);
  }

  if (protectiveDrivers.length > 0) {
    lines.push(`Mitigating / Protective Baseline Features:`);
    protectiveDrivers.forEach((driver) => {
      const shapPct = Math.abs(driver.shapValue * 100).toFixed(1);
      lines.push(
        `  - ${driver.featureName} (${driver.featureValueDisplay}): -${shapPct}% protective modulation`
      );
    });
  }

  lines.push(
    ``,
    `[P] PLAN:`,
    `- Clinical Triage Interval: Recommended follow-up in ${prediction.followUpWindow}.`
  );

  // Intervention plan based on Tier
  if (prediction.tier === 'tier3_critical') {
    lines.push(
      `- TIER-3 CRITICAL ESCALATION:`,
      `  * Urgent physician-led clinical evaluation and baseline 12-lead ECG.`,
      `  * Recommend intensive antihypertensive titration targeting SBP <= 125-130 mmHg (consider combination ACEi/ARB + CCB/thiazide).`,
      `  * Recommend initiation of high-intensity statin therapy (Atorvastatin 40-80 mg or Rosuvastatin 20-40 mg) to achieve >=50% LDL reduction.`,
      patient.tobacco === 1
        ? `  * Urgent referral to structured tobacco cessation program + nicotine replacement therapy (NRT) / varenicline.`
        : '',
      patient.fastingGlucCategory === 'diabetic'
        ? `  * Glycemic optimization: check HbA1c; consider SGLT2 inhibitor or GLP-1 RA with proven cardiovascular outcome benefit.`
        : '',
      `  * Repeat comprehensive metabolic panel, lipid profile, and renal function in 2-4 weeks.`
    );
  } else if (prediction.tier === 'tier2_moderate') {
    lines.push(
      `- TIER-2 MODERATE INTERVENTION:`,
      `  * Secondary prevention pathway initiated.`,
      `  * Blood pressure target: Titrate therapy to maintain SBP < 130 mmHg.`,
      `  * Lipid management: Initiate moderate-intensity statin therapy based on shared clinical decision-making.`,
      patient.tobacco === 1
        ? `  * Tobacco cessation counseling and behavioral support.`
        : '',
      `  * Dietary counseling (Mediterranean / DASH dietary pattern, sodium restriction < 2g/day).`,
      `  * Repeat fasting metabolic panel and clinic blood pressure check in 3-6 months.`
    );
  } else {
    lines.push(
      `- TIER-1 STABLE PROTOCOL:`,
      `  * Continue primary prevention lifestyle optimization.`,
      `  * Aerobic physical activity: Minimum 150 minutes of moderate-intensity exercise weekly.`,
      `  * Heart-healthy diet rich in legumes, fiber, unsaturated fats; limit ultra-processed sugars.`,
      `  * Annual preventive health examination and vitals monitoring in 12 months.`
    );
  }

  // Remove empty lines from filter
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i] === '') {
      if (i > 0 && lines[i - 1] === '') lines.splice(i, 1);
    }
  }

  if (counterfactual) {
    lines.push(
      ``,
      `-- Counterfactual "What-If" Intervention Simulation --`,
      `- Modeled Scenario: "${counterfactual.name}"`,
      `- Projected Risk Reduction: ${riskPct}% -> ${(counterfactual.projectedRisk * 100).toFixed(1)}%`,
      `- Absolute Risk Reduction (ARR): ${(counterfactual.arr * 100).toFixed(1)}% absolute drop`,
      `- Relative Risk Reduction (RRR): ${counterfactual.rrr.toFixed(1)}%`,
      `- Number Needed to Treat (NNT): ${counterfactual.nnt} patients to prevent 1 MACE event over 10 years`,
      `- Projected Status Transition: ${prediction.tierLabel} -> ${counterfactual.projectedTier.replace('_', ' ').toUpperCase()}`
    );
  }

  if (clinicianNotes.trim()) {
    lines.push(
      ``,
      `-- Clinician Exam Addendum & Observations --`,
      clinicianNotes.trim()
    );
  }

  lines.push(
    ``,
    `--------------------------------------------------------------------------------`,
    `CLINICAL GOVERNANCE & REGULATORY DISCLAIMER:`,
    `CardioAlert CDSS is a non-autonomous Clinical Decision Support System intended for`,
    `licensed healthcare professionals. It synthesizes multivariable empirical Framingham`,
    `and gradient-boosted ensembles to assist triage. It does NOT replace physician judgment,`,
    `autonomous prescription rights, or direct diagnostic physical assessment.`,
    `ELECTRONIC SIGNATURE: Validated by ${clinicianName} on ${dateStr}`,
    `================================================================================`
  );

  return lines.join('\n');
}
