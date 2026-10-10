import React from 'react';
import {
  User,
  Heart,
  Droplet,
  Cigarette,
  Flame,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale,
} from 'lucide-react';
import { PatientData, Sex } from '../types/clinical';
import { getCholesterolCategory, getGlucoseCategory } from '../lib/mlEngine';

interface PatientIntakeFormProps {
  patient: PatientData;
  onChange: (updated: PatientData) => void;
  onSubmitAssessment?: () => void;
  isSubmitting?: boolean;
}

export const PatientIntakeForm: React.FC<PatientIntakeFormProps> = ({
  patient,
  onChange,
  onSubmitAssessment,
  isSubmitting = false,
}) => {
  const pulsePressure = patient.sbp - patient.dbp;
  const meanArterialPressure = Math.round(patient.dbp + (1 / 3) * pulsePressure);

  // ACC/AHA 2017 Blood Pressure classification
  const getBpClassification = (sbp: number, dbp: number) => {
    if (sbp >= 180 || dbp >= 120) {
      return {
        label: 'Hypertensive Crisis',
        color: 'text-rose-700 bg-rose-100 border-rose-300',
      };
    }
    if (sbp >= 140 || dbp >= 90) {
      return {
        label: 'Stage 2 Hypertension',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
      };
    }
    if (sbp >= 130 || dbp >= 80) {
      return {
        label: 'Stage 1 Hypertension',
        color: 'text-amber-800 bg-amber-50 border-amber-200',
      };
    }
    if (sbp >= 120 && dbp < 80) {
      return {
        label: 'Elevated BP',
        color: 'text-yellow-800 bg-yellow-50 border-yellow-200',
      };
    }
    return {
      label: 'Normal BP',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    };
  };

  const bpStatus = getBpClassification(patient.sbp, patient.dbp);

  const updateField = <K extends keyof PatientData>(key: K, value: PatientData[K]) => {
    const updated = { ...patient, [key]: value };
    if (key === 'totalChol') {
      updated.totalCholCategory = getCholesterolCategory(value as number);
    }
    if (key === 'fastingGluc') {
      updated.fastingGlucCategory = getGlucoseCategory(value as number);
    }
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-crimson-card border border-rose-100 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rose-50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80">
            <Heart className="w-5 h-5 fill-rose-600" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
              Health Indicator Intake
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Vitals, Laboratory Panel & Lifestyle Factors
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono bg-rose-50 text-rose-800 px-3 py-1 rounded-full border border-rose-200 font-semibold">
          Model v2.4 Aligned
        </span>
      </div>

      {/* Patient Name & Sex */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Patient Identifier / Record Name</label>
          <input
            type="text"
            value={patient.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full bg-[#FFF8F8] border border-rose-200 rounded-2xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition font-medium"
            placeholder="e.g. Patient Full Name"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Biological Sex</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['male', 'female'] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateField('sex', s)}
                className={`py-2 px-2 text-xs font-bold rounded-2xl capitalize border transition cursor-pointer ${
                  patient.sex === s
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-[#FFF8F8] border-rose-200 text-slate-600 hover:bg-rose-100/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Patient Age & BMI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Age Slider with Direct Type Input */}
        <div className="bg-[#FFF8F8] p-4 rounded-2xl border border-rose-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Patient Age (18–80 yrs)</span>
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-rose-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 shadow-xs transition">
              <input
                type="number"
                min={18}
                max={80}
                value={patient.age || ''}
                onChange={(e) => updateField('age', e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-12 bg-transparent text-right font-mono font-black text-sm text-rose-700 focus:outline-none"
                placeholder="Age"
                title="Directly type patient age"
              />
              <span className="font-mono font-bold text-xs text-rose-600">yrs</span>
            </div>
          </div>
          <input
            type="range"
            min={18}
            max={80}
            step={1}
            value={patient.age || 18}
            onChange={(e) => updateField('age', Number(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>18 yrs</span>
            <span>30 yrs (Standard Baseline)</span>
            <span>80 yrs</span>
          </div>
          {patient.age > 0 && patient.age < 30 && (
            <div className="flex items-center gap-1.5 text-[11px] text-rose-700 bg-rose-50/80 px-2.5 py-1.5 rounded-xl border border-rose-200/60 font-medium">
              <Info className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Young Adult (18–29): 10-yr hard ASCVD risk is naturally baseline low. Focus is on lifetime lifestyle prevention.</span>
            </div>
          )}
        </div>

        {/* BMI Metric with Direct Type Input */}
        <div className="bg-[#FFF8F8] p-4 rounded-2xl border border-rose-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-rose-600" />
              Body Mass Index (BMI)
            </span>
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-rose-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 shadow-xs transition">
              <input
                type="number"
                min={15}
                max={60}
                step={0.1}
                value={patient.bmi ?? 26.2}
                onChange={(e) => updateField('bmi', e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-14 bg-transparent text-right font-mono font-black text-sm text-rose-700 focus:outline-none"
                placeholder="BMI"
                title="Directly type patient BMI"
              />
              <span className="font-mono font-bold text-xs text-rose-600">kg/m²</span>
            </div>
          </div>
          <input
            type="range"
            min={18}
            max={42}
            step={0.5}
            value={patient.bmi || 26.2}
            onChange={(e) => updateField('bmi', Number(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>18.5 (Normal)</span>
            <span>25.0 (Overweight)</span>
            <span>30.0+ (Obese)</span>
          </div>
        </div>
      </div>

      {/* 2. Blood Pressure (SBP & DBP) */}
      <div className="bg-[#FFF8F8] p-4 rounded-2xl border border-rose-100 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-slate-800">
              Hemodynamic Blood Pressure
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${bpStatus.color}`}>
            {bpStatus.label}
          </span>
        </div>

        {/* SBP Slider with Direct Type Pill */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 font-semibold">Systolic Blood Pressure (SBP)</span>
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-rose-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 shadow-xs transition font-mono">
              <input
                type="number"
                min={90}
                max={220}
                value={patient.sbp || ''}
                onChange={(e) => updateField('sbp', e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-14 bg-transparent text-right font-black text-sm text-rose-700 focus:outline-none"
                placeholder="SBP"
                title="Directly type systolic blood pressure"
              />
              <span className="text-slate-500 text-xs font-bold">mmHg</span>
            </div>
          </div>
          <input
            type="range"
            min={90}
            max={220}
            step={1}
            value={patient.sbp || 90}
            onChange={(e) => updateField('sbp', Number(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>90</span>
            <span>120 (Normal)</span>
            <span>140 (Stage 2)</span>
            <span>220 mmHg</span>
          </div>
        </div>

        {/* DBP Slider with Direct Type Pill */}
        <div className="space-y-1.5 pt-2 border-t border-rose-100">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 font-semibold">Diastolic Blood Pressure (DBP)</span>
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-rose-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 shadow-xs transition font-mono">
              <input
                type="number"
                min={55}
                max={130}
                value={patient.dbp || ''}
                onChange={(e) => updateField('dbp', e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-14 bg-transparent text-right font-black text-sm text-slate-800 focus:outline-none"
                placeholder="DBP"
                title="Directly type diastolic blood pressure"
              />
              <span className="text-slate-500 text-xs font-bold">mmHg</span>
            </div>
          </div>
          <input
            type="range"
            min={55}
            max={130}
            step={1}
            value={patient.dbp || 55}
            onChange={(e) => updateField('dbp', Number(e.target.value))}
            className="w-full accent-slate-800 cursor-pointer h-2 bg-rose-200/70 rounded-full"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>55</span>
            <span>80 (Normal)</span>
            <span>90 (Stage 2)</span>
            <span>130 mmHg</span>
          </div>
        </div>

        {/* Derived Pulse Pressure & MAP */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
          <div className="p-2 bg-white rounded-xl border border-rose-100 flex justify-between items-center">
            <span className="text-slate-500">Pulse Pressure:</span>
            <span className={`font-bold ${pulsePressure > 55 ? 'text-amber-700 font-bold' : 'text-slate-800'}`}>
              {pulsePressure} mmHg {pulsePressure > 55 && '⚠️'}
            </span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-rose-100 flex justify-between items-center">
            <span className="text-slate-500">MAP:</span>
            <span className="font-bold text-slate-800">{meanArterialPressure} mmHg</span>
          </div>
        </div>
      </div>

      {/* 3. Total Cholesterol Section */}
      <div className="bg-[#FFF8F8] p-4 rounded-2xl border border-rose-100 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-rose-600" />
            <span className="font-bold text-slate-800">Total Serum Cholesterol</span>
          </div>
          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-rose-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 shadow-xs transition font-mono">
            <input
              type="number"
              min={120}
              max={360}
              value={patient.totalChol || ''}
              onChange={(e) => updateField('totalChol', e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-14 bg-transparent text-right font-black text-sm text-rose-700 focus:outline-none"
              placeholder="Chol"
              title="Directly type total cholesterol"
            />
            <span className="text-slate-500 text-xs font-bold">mg/dL</span>
          </div>
        </div>
        <input
          type="range"
          min={120}
          max={360}
          step={1}
          value={patient.totalChol || 120}
          onChange={(e) => updateField('totalChol', Number(e.target.value))}
          className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
        />

        {/* Category Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
          <button
            type="button"
            onClick={() => updateField('totalChol', 180)}
            className={`py-1.5 rounded-full text-center font-bold border transition cursor-pointer ${
              patient.totalCholCategory === 'normal'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-600 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Normal (&lt;200)
          </button>
          <button
            type="button"
            onClick={() => updateField('totalChol', 220)}
            className={`py-1.5 rounded-full text-center font-bold border transition cursor-pointer ${
              patient.totalCholCategory === 'borderline'
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-white text-slate-600 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Borderline (200-239)
          </button>
          <button
            type="button"
            onClick={() => updateField('totalChol', 260)}
            className={`py-1.5 rounded-full text-center font-bold border transition cursor-pointer ${
              patient.totalCholCategory === 'high'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-slate-600 border-rose-200 hover:bg-rose-50'
            }`}
          >
            High (≥240)
          </button>
        </div>
      </div>

      {/* 4. Fasting Blood Glucose Section */}
      <div className="bg-[#FFF8F8] p-4 rounded-2xl border border-rose-100 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <span className="font-bold text-slate-800">Fasting Blood Glucose</span>
          </div>
          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-rose-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 shadow-xs transition font-mono">
            <input
              type="number"
              min={65}
              max={250}
              value={patient.fastingGluc || ''}
              onChange={(e) => updateField('fastingGluc', e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-14 bg-transparent text-right font-black text-sm text-rose-700 focus:outline-none"
              placeholder="Glucose"
              title="Directly type fasting blood glucose"
            />
            <span className="text-slate-500 text-xs font-bold">mg/dL</span>
          </div>
        </div>
        <input
          type="range"
          min={65}
          max={250}
          step={1}
          value={patient.fastingGluc || 65}
          onChange={(e) => updateField('fastingGluc', Number(e.target.value))}
          className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
        />

        {/* Glucose Category Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
          <button
            type="button"
            onClick={() => updateField('fastingGluc', 90)}
            className={`py-1.5 rounded-full text-center font-bold border transition cursor-pointer ${
              patient.fastingGlucCategory === 'normal'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-600 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Normal (&lt;100)
          </button>
          <button
            type="button"
            onClick={() => updateField('fastingGluc', 115)}
            className={`py-1.5 rounded-full text-center font-bold border transition cursor-pointer ${
              patient.fastingGlucCategory === 'impaired'
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-white text-slate-600 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Impaired (100-125)
          </button>
          <button
            type="button"
            onClick={() => updateField('fastingGluc', 140)}
            className={`py-1.5 rounded-full text-center font-bold border transition cursor-pointer ${
              patient.fastingGlucCategory === 'diabetic'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-slate-600 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Diabetic (≥126)
          </button>
        </div>
      </div>

      {/* 5. Tobacco Smoking Status */}
      <div className="bg-[#FFF8F8] p-4 rounded-2xl border border-rose-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Cigarette className="w-4 h-4 text-rose-600" />
            <span className="font-bold text-slate-800">Tobacco Smoking Status</span>
          </div>
          <span className="text-[10px] text-slate-400">Binary Multiplier</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => updateField('tobacco', 0)}
            className={`py-2 px-3 rounded-full border font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              patient.tobacco === 0
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-600 border-rose-200 hover:bg-rose-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Non-Smoker (0)
          </button>
          <button
            type="button"
            onClick={() => updateField('tobacco', 1)}
            className={`py-2 px-3 rounded-full border font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              patient.tobacco === 1
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-slate-600 border-rose-200 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Active Smoker (1)
          </button>
        </div>
      </div>

      {/* Medication Regimens Checkboxes */}
      <div className="pt-2 border-t border-rose-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 font-semibold">
            <input
              type="checkbox"
              checked={!!patient.onHypertensionMeds}
              onChange={(e) => updateField('onHypertensionMeds', e.target.checked)}
              className="rounded accent-rose-600"
            />
            <span>Antihypertensive Rx</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 font-semibold">
            <input
              type="checkbox"
              checked={!!patient.onStatin}
              onChange={(e) => updateField('onStatin', e.target.checked)}
              className="rounded accent-rose-600"
            />
            <span>Active Statin</span>
          </label>
        </div>

        {onSubmitAssessment && (
          <button
            type="button"
            onClick={onSubmitAssessment}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span>{isSubmitting ? 'Evaluating...' : 'Recalculate AI Risk'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
