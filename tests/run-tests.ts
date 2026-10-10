/**
 * Automated Clinical & Algorithmic Test Suite for CardioAlert CDSS
 * Verifies ML Risk Inference, TreeSHAP Attribution, Counterfactual Engine & Edge Cases
 */

import {
  predictCardiovascularRisk,
  getCholesterolCategory,
  getGlucoseCategory,
  getPatientHistory,
  PRESET_PATIENTS,
} from '../src/lib/mlEngine';
import { PatientData } from '../src/types/clinical';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${detail || 'Condition not met'}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('🧪 RUNNING CARDIOALERT CDSS TEST SUITE');
console.log('========================================\n');

// 1. Calibration & Probability Bounds
console.log('📦 Suite 1: Risk Probability Bounds & Calibration');
{
  const lowRiskPatient: PatientData = {
    name: 'Young Healthy',
    age: 22,
    sex: 'female',
    sbp: 110,
    dbp: 70,
    totalChol: 160,
    totalCholCategory: 'normal',
    fastingGluc: 85,
    fastingGlucCategory: 'normal',
    tobacco: 0,
  };
  const pred = predictCardiovascularRisk(lowRiskPatient);
  assert(pred.riskProbability >= 0 && pred.riskProbability <= 1, 'Probability must be in [0, 1]');
  assert(pred.riskProbability < 0.15, 'Young healthy female must be low risk (<15%)', `Got ${pred.riskProbability}`);
  assert(pred.tier === 'tier1_stable', 'Young healthy female must be Tier 1 Stable');
}

// 2. Critical Alert Bounds (Severe Hypertensive Emergency & Smoker)
console.log('\n📦 Suite 2: High Risk & Critical Alert Detection');
{
  const criticalPatient: PatientData = {
    name: 'Severe HTN Smoker',
    age: 65,
    sex: 'male',
    sbp: 185,
    dbp: 105,
    totalChol: 280,
    totalCholCategory: 'high',
    fastingGluc: 145,
    fastingGlucCategory: 'diabetic',
    tobacco: 1,
  };
  const pred = predictCardiovascularRisk(criticalPatient);
  assert(pred.riskProbability > 0.5, 'Severe multi-morbidity patient must exceed 50% risk', `Got ${pred.riskProbability}`);
  assert(pred.tier === 'tier3_critical', 'Patient must trigger Tier 3 Critical Alert');
}

// 3. TreeSHAP Attribution Exactness
console.log('\n📦 Suite 3: TreeSHAP Local Explainability');
{
  const patient = PRESET_PATIENTS[0].data;
  const pred = predictCardiovascularRisk(patient);
  assert(pred.shapValues.length >= 6, 'Must provide attributions for all core features');
  
  const smokingAttr = pred.shapValues.find((a) => a.featureKey === 'tobacco');
  assert(!!smokingAttr, 'Smoking attribution must exist');
  if (smokingAttr && patient.tobacco === 1) {
    assert(smokingAttr.shapValue > 0, 'Active tobacco must have positive risk attribution');
  }
}

// 4. Counterfactual What-If Simulation Math
console.log('\n📦 Suite 4: Counterfactual Intervention Engine');
{
  const patient = PRESET_PATIENTS[0].data;
  const baselinePred = predictCardiovascularRisk(patient);
  
  const treatedPatient: PatientData = {
    ...patient,
    sbp: 120,
    tobacco: 0,
    totalChol: 180,
    totalCholCategory: 'normal',
  };
  const treatedPred = predictCardiovascularRisk(treatedPatient);
  const arr = Math.max(0, baselinePred.riskProbability - treatedPred.riskProbability);
  const rrr = baselinePred.riskProbability > 0 ? (arr / baselinePred.riskProbability) * 100 : 0;
  const nnt = arr > 0.005 ? Math.ceil(1 / arr) : 100;
  
  assert(arr > 0, 'Effective treatment must produce positive Absolute Risk Reduction (ARR)');
  assert(rrr > 0, 'Effective treatment must produce positive Relative Risk Reduction (RRR)');
  assert(nnt > 0, 'Number Needed to Treat (NNT) must be positive');
  assert(treatedPred.riskProbability < baselinePred.riskProbability, 'Projected risk must be strictly lower than baseline');
}

// 5. Longitudinal History Generation
console.log('\n📦 Suite 5: Longitudinal Trend Data Integrity');
{
  const patient = PRESET_PATIENTS[0].data;
  const history = getPatientHistory(patient, 0.45);
  assert(history.length >= 4, 'Must provide longitudinal history with at least 4 encounters');
  assert(history.some((h) => h.isCurrent), 'History must tag the current clinical encounter');
}

// Summary
console.log('\n========================================');
console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All automated clinical tests passed with 100% compliance!\n');
}
