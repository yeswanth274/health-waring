import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Percent,
  ShieldCheck,
  RotateCcw,
  FileText,
  Heart,
} from 'lucide-react';
import { PatientData, RiskPrediction, CounterfactualScenario } from '../types/clinical';
import { predictCardiovascularRisk, getCholesterolCategory, getGlucoseCategory } from '../lib/mlEngine';

interface CounterfactualEngineProps {
  baselinePatient: PatientData;
  baselinePrediction: RiskPrediction;
  onApplyToPatient: (updated: PatientData) => void;
  onSetCounterfactualForSoap: (scenario: CounterfactualScenario | null) => void;
  activeScenarioForSoap: CounterfactualScenario | null;
}

export const CounterfactualEngine: React.FC<CounterfactualEngineProps> = ({
  baselinePatient,
  baselinePrediction,
  onApplyToPatient,
  onSetCounterfactualForSoap,
  activeScenarioForSoap,
}) => {
  const [cfPatient, setCfPatient] = useState<PatientData>({ ...baselinePatient });
  const [activePreset, setActivePreset] = useState<string>('custom');

  useEffect(() => {
    setCfPatient({ ...baselinePatient });
    setActivePreset('custom');
  }, [baselinePatient]);

  const cfPrediction = predictCardiovascularRisk(cfPatient);

  const baselineRisk = baselinePrediction.riskProbability;
  const cfRisk = cfPrediction.riskProbability;
  const arr = Math.max(0, baselineRisk - cfRisk);
  const rrr = baselineRisk > 0 ? (arr / baselineRisk) * 100 : 0;
  const nnt = arr > 0.005 ? Math.ceil(1 / arr) : 100;

  const targetsMet: string[] = [];
  if (cfPatient.sbp <= 125) targetsMet.push('Target SBP ≤ 125 mmHg Met');
  if (cfPatient.totalChol <= 190) targetsMet.push('Optimal Lipid Profile (Total Chol ≤ 190 mg/dL)');
  if (cfPatient.fastingGluc < 100) targetsMet.push('Euglycemia Achieved (Fasting Gluc < 100 mg/dL)');
  if (baselinePatient.tobacco === 1 && cfPatient.tobacco === 0) targetsMet.push('Tobacco Cessation Achieved');

  const scenarioObject: CounterfactualScenario = {
    id: activePreset,
    name:
      activePreset === 'sbp_125'
        ? 'Target SBP Titration (≤ 125 mmHg)'
        : activePreset === 'statin'
          ? 'Intensive Statin Therapy (Lipid Target)'
          : activePreset === 'tobacco_quit'
            ? 'Complete Tobacco Cessation'
            : activePreset === 'gdmt_bundle'
              ? 'Comprehensive Multi-Target GDMT Bundle'
              : 'Custom Clinician-Modeled What-If Plan',
    description: 'Simulated counterfactual treatment pathway targeting modifiable risk drivers.',
    targetParams: cfPatient,
    projectedRisk: cfRisk,
    arr,
    rrr,
    nnt,
    previousTier: baselinePrediction.tier,
    projectedTier: cfPrediction.tier,
    targetMetSummary: targetsMet,
  };

  const updateCfField = <K extends keyof PatientData>(key: K, value: PatientData[K]) => {
    setActivePreset('custom');
    const updated = { ...cfPatient, [key]: value };
    if (key === 'totalChol') {
      updated.totalCholCategory = getCholesterolCategory(value as number);
    }
    if (key === 'fastingGluc') {
      updated.fastingGlucCategory = getGlucoseCategory(value as number);
    }
    setCfPatient(updated);
  };

  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    const updated = { ...baselinePatient };

    switch (presetKey) {
      case 'sbp_125':
        updated.sbp = Math.min(baselinePatient.sbp, 124);
        updated.dbp = Math.min(baselinePatient.dbp, 78);
        updated.onHypertensionMeds = true;
        break;

      case 'statin':
        updated.totalChol = Math.min(baselinePatient.totalChol, 175);
        updated.totalCholCategory = 'normal';
        updated.onStatin = true;
        break;

      case 'tobacco_quit':
        updated.tobacco = 0;
        break;

      case 'glucose_control':
        updated.fastingGluc = Math.min(baselinePatient.fastingGluc, 95);
        updated.fastingGlucCategory = 'normal';
        break;

      case 'gdmt_bundle':
        updated.sbp = Math.min(baselinePatient.sbp, 122);
        updated.dbp = Math.min(baselinePatient.dbp, 76);
        updated.totalChol = Math.min(baselinePatient.totalChol, 170);
        updated.totalCholCategory = 'normal';
        updated.fastingGluc = Math.min(baselinePatient.fastingGluc, 92);
        updated.fastingGlucCategory = 'normal';
        updated.tobacco = 0;
        updated.onHypertensionMeds = true;
        updated.onStatin = true;
        break;

      default:
        break;
    }
    setCfPatient(updated);
  };

  const handleResetToBaseline = () => {
    setCfPatient({ ...baselinePatient });
    setActivePreset('custom');
  };

  const isSoapAttached =
    activeScenarioForSoap && activeScenarioForSoap.projectedRisk === cfRisk;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-crimson-card border border-rose-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-50 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
                Counterfactual "What-If" Intervention Engine
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Simulate treatment targets: calculate projected risk reduction upon achieving therapeutic endpoints
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetToBaseline}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-[#FFF8F8] rounded-full border border-rose-200 transition cursor-pointer font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Baseline
        </button>
      </div>

      {/* Preset Intervention Pills */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">
          Target Intervention Presets:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => applyPreset('sbp_125')}
            className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between cursor-pointer ${
              activePreset === 'sbp_125'
                ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                : 'bg-[#FFF8F8] border-rose-200/80 text-slate-800 hover:border-rose-300'
            }`}
          >
            <span className="font-bold text-xs">Titrate SBP ≤ 125</span>
            <span className={`text-[10px] mt-1 ${activePreset === 'sbp_125' ? 'text-rose-100' : 'text-slate-500'}`}>
              Anti-hypertensive Rx
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('statin')}
            className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between cursor-pointer ${
              activePreset === 'statin'
                ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                : 'bg-[#FFF8F8] border-rose-200/80 text-slate-800 hover:border-rose-300'
            }`}
          >
            <span className="font-bold text-xs">Statin Initiation</span>
            <span className={`text-[10px] mt-1 ${activePreset === 'statin' ? 'text-rose-100' : 'text-slate-500'}`}>
              Total Chol ≤ 175 mg/dL
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('tobacco_quit')}
            className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between cursor-pointer ${
              activePreset === 'tobacco_quit'
                ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                : 'bg-[#FFF8F8] border-rose-200/80 text-slate-800 hover:border-rose-300'
            }`}
          >
            <span className="font-bold text-xs">Smoking Cessation</span>
            <span className={`text-[10px] mt-1 ${activePreset === 'tobacco_quit' ? 'text-rose-100' : 'text-slate-500'}`}>
              Complete Tobacco Quit
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('glucose_control')}
            className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between cursor-pointer ${
              activePreset === 'glucose_control'
                ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                : 'bg-[#FFF8F8] border-rose-200/80 text-slate-800 hover:border-rose-300'
            }`}
          >
            <span className="font-bold text-xs">Euglycemia Target</span>
            <span className={`text-[10px] mt-1 ${activePreset === 'glucose_control' ? 'text-rose-100' : 'text-slate-500'}`}>
              Fasting Gluc &lt; 100 mg/dL
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('gdmt_bundle')}
            className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between col-span-2 sm:col-span-1 cursor-pointer ${
              activePreset === 'gdmt_bundle'
                ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                : 'bg-rose-50 border-rose-300 text-rose-900 hover:border-rose-400'
            }`}
          >
            <span className="font-bold text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Full GDMT Bundle
            </span>
            <span className={`text-[10px] mt-1 ${activePreset === 'gdmt_bundle' ? 'text-rose-100' : 'text-rose-700'}`}>
              All Targets Combined
            </span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline State */}
        <div className="bg-[#FFF8F8] p-4 rounded-3xl border border-rose-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Current Baseline Status
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-800 border border-rose-200">
              {baselinePrediction.tierLabel}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900">
              {(baselineRisk * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">10-Year ASCVD Risk</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 pt-2 border-t border-rose-200/60">
            <div>BP: <strong className="text-slate-900">{baselinePatient.sbp}/{baselinePatient.dbp}</strong> mmHg</div>
            <div>Chol: <strong className="text-slate-900">{baselinePatient.totalChol}</strong> mg/dL</div>
            <div>Gluc: <strong className="text-slate-900">{baselinePatient.fastingGluc}</strong> mg/dL</div>
            <div>Tobacco: <strong className="text-slate-900">{baselinePatient.tobacco === 1 ? 'Smoker' : 'None'}</strong></div>
          </div>
        </div>

        {/* Counterfactual Projected State */}
        <div className="bg-rose-50/60 p-4 rounded-3xl border border-rose-300 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              2. Projected Post-Intervention
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
              {cfPrediction.tierLabel}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-rose-700">
              {(cfRisk * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-rose-800 font-bold">
              (-{(arr * 100).toFixed(1)}% absolute drop)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-rose-950 pt-2 border-t border-rose-200">
            <div>Target BP: <strong className="text-rose-700">{cfPatient.sbp}/{cfPatient.dbp}</strong> mmHg</div>
            <div>Target Chol: <strong className="text-rose-700">{cfPatient.totalChol}</strong> mg/dL</div>
            <div>Target Gluc: <strong className="text-rose-700">{cfPatient.fastingGluc}</strong> mg/dL</div>
            <div>Target Tobacco: <strong className="text-rose-700">{cfPatient.tobacco === 1 ? 'Smoker' : 'None'}</strong></div>
          </div>
        </div>
      </div>

      {/* Impact Indicators: ARR, RRR, NNT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Absolute Risk Reduction (ARR)
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <span className="text-2xl font-black font-mono text-emerald-600">
              -{(arr * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Net percentage points prevented</span>
        </div>

        <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Relative Risk Reduction (RRR)
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Percent className="w-4 h-4 text-rose-600" />
            <span className="text-2xl font-black font-mono text-rose-600">
              {rrr.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Proportional baseline risk spared</span>
        </div>

        <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Number Needed to Treat (NNT)
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span className="text-2xl font-black font-mono text-slate-900">
              NNT = {nnt}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Pts treated to prevent 1 event over 10 yrs</span>
        </div>
      </div>

      {/* Fine-Tune Sliders */}
      <div className="space-y-4 pt-2 border-t border-rose-100">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider">
            Fine-Tune Simulated Clinical Targets:
          </span>
          <span className="text-slate-400 font-mono text-[11px]">Real-time Recalibration</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Target SBP */}
          <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-semibold">Target Systolic BP</span>
              <div className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full border border-rose-200 focus-within:border-rose-500 shadow-xs font-mono">
                <input
                  type="number"
                  min={90}
                  max={200}
                  value={cfPatient.sbp || ''}
                  onChange={(e) => updateCfField('sbp', e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-12 bg-transparent text-right font-black text-xs text-rose-700 focus:outline-none"
                  title="Directly type target SBP"
                />
                <span className="text-slate-400 text-[10px]">mmHg</span>
              </div>
            </div>
            <input
              type="range"
              min={90}
              max={200}
              value={cfPatient.sbp || 90}
              onChange={(e) => updateCfField('sbp', Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>90</span>
              <span>120 (Optimal)</span>
              <span>200</span>
            </div>
          </div>

          {/* Target Total Cholesterol */}
          <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-semibold">Target Cholesterol</span>
              <div className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full border border-rose-200 focus-within:border-rose-500 shadow-xs font-mono">
                <input
                  type="number"
                  min={120}
                  max={320}
                  value={cfPatient.totalChol || ''}
                  onChange={(e) => updateCfField('totalChol', e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-12 bg-transparent text-right font-black text-xs text-rose-700 focus:outline-none"
                  title="Directly type target cholesterol"
                />
                <span className="text-slate-400 text-[10px]">mg/dL</span>
              </div>
            </div>
            <input
              type="range"
              min={120}
              max={320}
              value={cfPatient.totalChol || 120}
              onChange={(e) => updateCfField('totalChol', Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>120</span>
              <span>180 (Optimal)</span>
              <span>320</span>
            </div>
          </div>

          {/* Target Fasting Glucose */}
          <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-semibold">Target Glucose</span>
              <div className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full border border-rose-200 focus-within:border-rose-500 shadow-xs font-mono">
                <input
                  type="number"
                  min={65}
                  max={200}
                  value={cfPatient.fastingGluc || ''}
                  onChange={(e) => updateCfField('fastingGluc', e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-12 bg-transparent text-right font-black text-xs text-rose-700 focus:outline-none"
                  title="Directly type target fasting glucose"
                />
                <span className="text-slate-400 text-[10px]">mg/dL</span>
              </div>
            </div>
            <input
              type="range"
              min={65}
              max={200}
              value={cfPatient.fastingGluc || 65}
              onChange={(e) => updateCfField('fastingGluc', Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>65</span>
              <span>90 (Euglycemic)</span>
              <span>200</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-rose-100">
        <button
          onClick={() => onSetCounterfactualForSoap(isSoapAttached ? null : scenarioObject)}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full border transition cursor-pointer ${
            isSoapAttached
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-white hover:bg-rose-50 text-slate-700 border-rose-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          {isSoapAttached ? 'Attached to EHR SOAP Note ✓' : 'Attach Scenario to EHR SOAP Note'}
        </button>

        <button
          onClick={() => onApplyToPatient(cfPatient)}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-full text-xs font-bold shadow-crimson-button transition cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Apply Simulated Targets to Primary Patient Record
        </button>
      </div>
    </div>
  );
};
