import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Heart,
  Activity,
  Droplet,
  Flame,
  Cigarette,
  Scale,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PatientData, Sex } from '../types/clinical';
import { getCholesterolCategory, getGlucoseCategory, predictCardiovascularRisk } from '../lib/mlEngine';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePatient: (newPatient: PatientData) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  isOpen,
  onClose,
  onSavePatient,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(54);
  const [sex, setSex] = useState<Sex>('male');
  const [sbp, setSbp] = useState<number>(136);
  const [dbp, setDbp] = useState<number>(84);
  const [totalChol, setTotalChol] = useState<number>(215);
  const [fastingGluc, setFastingGluc] = useState<number>(105);
  const [bmi, setBmi] = useState<number>(25.8);
  const [tobacco, setTobacco] = useState<0 | 1>(0);
  const [onHypertensionMeds, setOnHypertensionMeds] = useState(false);
  const [onStatin, setOnStatin] = useState(false);
  const [initialNote, setInitialNote] = useState('New patient outpatient intake & initial baseline triage.');
  const [nameError, setNameError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Please enter a patient full name or record identifier');
      return;
    }

    const newPatientData: PatientData = {
      id: `custom-pt-${Date.now()}`,
      name: name.trim(),
      age: Math.min(80, Math.max(30, age)),
      sex,
      sbp: Math.min(220, Math.max(90, sbp)),
      dbp: Math.min(130, Math.max(55, dbp)),
      totalChol: Math.min(360, Math.max(120, totalChol)),
      totalCholCategory: getCholesterolCategory(totalChol),
      fastingGluc: Math.min(250, Math.max(65, fastingGluc)),
      fastingGlucCategory: getGlucoseCategory(fastingGluc),
      bmi,
      tobacco,
      onHypertensionMeds,
      onStatin,
    };

    onSavePatient(newPatientData);
    onClose();
  };

  // Preview estimated risk probability in modal
  const previewPrediction = predictCardiovascularRisk({
    name: name || 'New Patient',
    age,
    sex,
    sbp,
    dbp,
    totalChol,
    totalCholCategory: getCholesterolCategory(totalChol),
    fastingGluc,
    fastingGlucCategory: getGlucoseCategory(fastingGluc),
    tobacco,
    bmi,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-rose-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-rose-100 bg-[#FFF8F8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-crimson-button">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Register New Patient Intake Record
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Enter demographic vitals & metabolic panel to instantiate a fresh clinical profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-rose-100/60 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-5 text-xs">
          {/* Patient Name & Sex */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-700">Patient Full Name / MRN Identifier *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="e.g. Sarah Jenkins or PT-89421"
                className={`w-full bg-[#FFF8F8] border rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition font-medium ${
                  nameError ? 'border-rose-500 focus:ring-rose-200' : 'border-rose-200 focus:border-rose-500 focus:ring-rose-200'
                }`}
              />
              {nameError && (
                <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {nameError}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Biological Sex</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['male', 'female'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`py-2 px-2 text-xs font-bold rounded-2xl capitalize border transition cursor-pointer ${
                      sex === s
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

          {/* Age & BMI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Age (30–80 yrs)</span>
                <div className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full border border-rose-200 font-mono">
                  <input
                    type="number"
                    min={30}
                    max={80}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-10 bg-transparent text-right font-black text-xs text-rose-700 focus:outline-none"
                  />
                  <span className="text-slate-400 text-[10px]">yrs</span>
                </div>
              </div>
              <input
                type="range"
                min={30}
                max={80}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
              />
            </div>

            <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-rose-600" />
                  BMI (kg/m²)
                </span>
                <div className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full border border-rose-200 font-mono">
                  <input
                    type="number"
                    min={15}
                    max={60}
                    step={0.1}
                    value={bmi}
                    onChange={(e) => setBmi(Number(e.target.value))}
                    className="w-12 bg-transparent text-right font-black text-xs text-rose-700 focus:outline-none"
                  />
                  <span className="text-slate-400 text-[10px]">kg/m²</span>
                </div>
              </div>
              <input
                type="range"
                min={18}
                max={42}
                step={0.5}
                value={bmi}
                onChange={(e) => setBmi(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
              />
            </div>
          </div>

          {/* Hemodynamics (SBP & DBP) */}
          <div className="bg-[#FFF8F8] p-4 rounded-2xl border border-rose-100 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600" />
              <span className="font-bold text-slate-800">Hemodynamic Vitals</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600 font-semibold">Systolic BP (SBP)</span>
                  <span className="font-mono font-bold text-rose-700">{sbp} mmHg</span>
                </div>
                <input
                  type="range"
                  min={90}
                  max={220}
                  value={sbp}
                  onChange={(e) => setSbp(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600 font-semibold">Diastolic BP (DBP)</span>
                  <span className="font-mono font-bold text-slate-800">{dbp} mmHg</span>
                </div>
                <input
                  type="range"
                  min={55}
                  max={130}
                  value={dbp}
                  onChange={(e) => setDbp(Number(e.target.value))}
                  className="w-full accent-slate-800 cursor-pointer h-2 bg-rose-200/70 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Metabolic Panel (Cholesterol & Fasting Glucose) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 text-rose-600" />
                  Total Cholesterol
                </span>
                <span className="font-mono font-bold text-xs text-rose-700">{totalChol} mg/dL</span>
              </div>
              <input
                type="range"
                min={120}
                max={360}
                value={totalChol}
                onChange={(e) => setTotalChol(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
              />
            </div>

            <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  Fasting Glucose
                </span>
                <span className="font-mono font-bold text-xs text-rose-700">{fastingGluc} mg/dL</span>
              </div>
              <input
                type="range"
                min={65}
                max={250}
                value={fastingGluc}
                onChange={(e) => setFastingGluc(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-200/70 rounded-full"
              />
            </div>
          </div>

          {/* Tobacco & Rx Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 space-y-1.5">
              <span className="font-bold text-slate-700 block">Tobacco Smoking Status</span>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setTobacco(0)}
                  className={`py-1.5 rounded-full font-bold border transition cursor-pointer text-center ${
                    tobacco === 0 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-rose-200'
                  }`}
                >
                  Non-Smoker
                </button>
                <button
                  type="button"
                  onClick={() => setTobacco(1)}
                  className={`py-1.5 rounded-full font-bold border transition cursor-pointer text-center ${
                    tobacco === 1 ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-rose-200'
                  }`}
                >
                  Active Smoker
                </button>
              </div>
            </div>

            <div className="bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 flex flex-col justify-center space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={onHypertensionMeds}
                  onChange={(e) => setOnHypertensionMeds(e.target.checked)}
                  className="rounded accent-rose-600"
                />
                <span>Prescribed Antihypertensives</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={onStatin}
                  onChange={(e) => setOnStatin(e.target.checked)}
                  className="rounded accent-rose-600"
                />
                <span>Active Statin Therapy</span>
              </label>
            </div>
          </div>

          {/* Initial Live Risk Preview Banner */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-600 fill-rose-600 animate-heartbeat" />
              <div>
                <span className="font-bold text-slate-900 block">Initial Model Projection:</span>
                <span className="text-[11px] text-slate-500">Tier: {previewPrediction.tierLabel}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-lg text-rose-700">
                {(previewPrediction.riskProbability * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block">10-Yr Risk</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-rose-50 text-slate-700 border border-rose-200 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold shadow-crimson-button transition cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Patient Profile & Launch Triage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
