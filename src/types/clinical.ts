export type CholesterolCategory = 'normal' | 'borderline' | 'high';
export type GlucoseCategory = 'normal' | 'impaired' | 'diabetic';
export type TobaccoStatus = 0 | 1; // 0: Non-smoker, 1: Active smoker
export type Sex = 'male' | 'female';

export interface VisitHistoryItem {
  id: string;
  visitDate: string;
  visitLabel: string;
  riskScore: number; // 0 - 100 percentage
  sbp: number;
  dbp: number;
  totalChol: number;
  fastingGluc: number;
  tobacco: TobaccoStatus;
  tier: RiskTier;
  interventionNote?: string;
  isCurrent?: boolean;
}

export interface PatientData {
  id?: string;
  name: string;
  age: number; // 18 - 80 (Adult cardiovascular assessment)
  sex: Sex;
  sbp: number; // 90 - 220 mmHg
  dbp: number; // 55 - 130 mmHg
  totalChol: number; // 120 - 360 mg/dL
  totalCholCategory: CholesterolCategory;
  fastingGluc: number; // 65 - 250 mg/dL
  fastingGlucCategory: GlucoseCategory;
  tobacco: TobaccoStatus;
  bmi?: number; // 18.5 - 45 kg/m²
  activityLevel?: 'sedentary' | 'moderate' | 'active';
  onHypertensionMeds?: boolean;
  onStatin?: boolean;
  history?: VisitHistoryItem[];
}

export type RiskTier = 'tier1_stable' | 'tier2_moderate' | 'tier3_critical';

export interface ShapAttribution {
  featureKey: string;
  featureName: string;
  featureValueDisplay: string;
  baseValue: number;
  actualValue: number | string;
  shapValue: number; // in probability space (-1.0 to 1.0)
  shapLogOdds?: number;
  direction: 'risk_increasing' | 'risk_decreasing' | 'neutral';
  clinicalMechanism: string;
}

export interface RiskPrediction {
  riskProbability: number; // 0.0 to 1.0 (calibrated 10-year CVD risk)
  rawLogOdds: number;
  tier: RiskTier;
  tierLabel: string;
  tierSubtitle: string;
  tierColor: string;
  tierBgColor: string;
  tierBorderColor: string;
  baseValue: number; // E[f(x)] ~ 0.185 (18.5%)
  shapValues: ShapAttribution[];
  clinicalActionDirective: string;
  followUpWindow: string;
}

export interface CounterfactualScenario {
  id: string;
  name: string;
  description: string;
  targetParams: Partial<PatientData>;
  projectedRisk: number;
  arr: number; // Absolute Risk Reduction (percentage points)
  rrr: number; // Relative Risk Reduction (%)
  nnt: number; // Number Needed to Treat
  previousTier: RiskTier;
  projectedTier: RiskTier;
  targetMetSummary: string[];
}

export interface PresetPatient {
  id: string;
  badge: string;
  title: string;
  description: string;
  data: PatientData;
}
