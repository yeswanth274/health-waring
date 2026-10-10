import React from 'react';
import {
  HeartPulse,
  ShieldCheck,
  FileText,
  Activity,
  RotateCcw,
  Sliders,
  AlertCircle,
  Database,
  History,
} from 'lucide-react';
import { PRESET_PATIENTS } from '../lib/mlEngine';
import { PatientData } from '../types/clinical';

interface HeaderProps {
  currentPatient: PatientData;
  onSelectPreset: (preset: PatientData) => void;
  onReset: () => void;
  onOpenAudit: () => void;
  onOpenSoap: () => void;
  activeTab: 'dashboard' | 'trend' | 'whatif' | 'soap';
  setActiveTab: (tab: 'dashboard' | 'trend' | 'whatif' | 'soap') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPatient,
  onSelectPreset,
  onReset,
  onOpenAudit,
  onOpenSoap,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with branding and regulatory badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-800/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-950/40 text-white font-bold ring-1 ring-rose-400/30">
              <HeartPulse className="w-6 h-6 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  CardioAlert <span className="text-rose-400">CDSS</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  Tier-1 CDSS • SaMD Class I
                </span>
                <span className="hidden lg:inline-flex text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                  TRIPOD+AI Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cardiovascular Risk Stratification, TreeSHAP Explainability & Counterfactual Interventions
              </p>
            </div>
          </div>

          {/* Quick actions: Audit & SOAP buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onOpenAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition"
              title="Inspect ML Validation, ROC-AUC >= 0.75, & TreeSHAP Pipeline"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Model Audit & ROC</span>
            </button>

            <button
              onClick={onOpenSoap}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-800/60 transition"
              title="Generate pre-formatted EHR SOAP Note"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>EHR SOAP Note</span>
            </button>

            <button
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition"
              title="Reset to default intake parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom bar with preset vignettes & navigation tabs */}
        <div className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Preset Patients */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              Clinical Vignettes:
            </span>
            <div className="flex items-center gap-1.5">
              {PRESET_PATIENTS.map((p) => {
                const isSelected =
                  currentPatient.name === p.data.name &&
                  currentPatient.age === p.data.age &&
                  currentPatient.sbp === p.data.sbp;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPreset(p.data)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap shrink-0 border ${
                      isSelected
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-xs'
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/50'
                    }`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                        p.badge.includes('Critical')
                          ? 'bg-rose-400'
                          : p.badge.includes('Moderate')
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                      }`}
                    />
                    {p.data.name.split(' ')[0]} ({p.data.age}
                    {p.data.sex === 'male' ? 'M' : 'F'})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation view tabs */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Stratification & SHAP</span>
            </button>
            <button
              onClick={() => setActiveTab('trend')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                activeTab === 'trend'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>Risk Trend</span>
            </button>
            <button
              onClick={() => setActiveTab('whatif')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                activeTab === 'whatif'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Counterfactual ("What-If")</span>
            </button>
            <button
              onClick={() => setActiveTab('soap')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                activeTab === 'soap'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>SOAP Progress Note</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
