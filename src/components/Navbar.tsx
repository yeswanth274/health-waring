import React from 'react';
import {
  Heart,
  Activity,
  BarChart3,
  Sliders,
  History,
  FileText,
  ShieldCheck,
  RotateCcw,
  Database,
  Home,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { PresetPatient, PatientData } from '../types/clinical';

export type NavTab = 'landing' | 'dashboard' | 'assessment' | 'insights' | 'history' | 'soap';

interface NavbarProps {
  currentPatient: PatientData;
  patients: PresetPatient[];
  onSelectPreset: (preset: PatientData) => void;
  onOpenNewPatient: () => void;
  onReset: () => void;
  onOpenAudit: () => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPatient,
  patients,
  onSelectPreset,
  onOpenNewPatient,
  onReset,
  onOpenAudit,
  activeTab,
  setActiveTab,
}) => {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with branding, patient vignettes, audit button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 border-b border-rose-50 gap-3">
          {/* HealthU Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center text-white shadow-crimson-button transition transform group-hover:scale-105">
                <Heart className="w-5 h-5 fill-white animate-heartbeat" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-900">
                    Health<span className="text-rose-600">U</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    Early-Warning AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Disease Risk Detection & CDSS
                </p>
              </div>
            </button>
          </div>

          {/* Preset Patients Vignettes Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Patients:
            </span>
            <div className="flex items-center gap-1.5">
              {patients.map((p) => {
                const isSelected =
                  currentPatient.name === p.data.name &&
                  currentPatient.age === p.data.age &&
                  currentPatient.sbp === p.data.sbp;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPreset(p.data);
                      if (activeTab === 'landing') setActiveTab('dashboard');
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap shrink-0 border cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-[#FFF6F7] text-slate-700 hover:bg-rose-100/70 border-rose-200/80'
                    }`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                        isSelected
                          ? 'bg-white'
                          : p.badge.includes('Critical')
                            ? 'bg-rose-500'
                            : p.badge.includes('Moderate')
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                      }`}
                    />
                    {p.data.name.split(' ')[0]} ({p.data.age}
                    {p.data.sex === 'male' ? 'M' : 'F'})
                  </button>
                );
              })}

              {/* Add New Patient Action Button */}
              <button
                onClick={onOpenNewPatient}
                className="px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap shrink-0 border border-dashed border-rose-300 bg-rose-50/70 hover:bg-rose-100 text-rose-700 flex items-center gap-1 cursor-pointer shadow-xs"
                title="Register and add a new patient record"
              >
                <UserPlus className="w-3.5 h-3.5 text-rose-600" />
                <span>+ New Patient</span>
              </button>
            </div>
          </div>

          {/* Right Header Controls: Audit & Reset */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={onOpenAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-full border border-rose-200 transition cursor-pointer"
              title="Inspect Model Validation, ROC-AUC >= 0.75 & TRIPOD+AI"
            >
              <Database className="w-3.5 h-3.5 text-rose-600" />
              <span>Model Audit & ROC</span>
            </button>

            <button
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-rose-50 rounded-full border border-rose-100 transition cursor-pointer"
              title="Reset intake to baseline healthy physical"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Navigation Pills in Pinterest Reference Style */}
        <div className="py-2.5 flex items-center justify-between overflow-x-auto scrollbar-none gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('landing')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'landing'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#FFF8F8] text-slate-600 hover:bg-rose-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#FFF8F8] text-slate-600 hover:bg-rose-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'assessment'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#FFF8F8] text-slate-600 hover:bg-rose-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Health Assessment</span>
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#FFF8F8] text-slate-600 hover:bg-rose-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Risk Insights & SHAP</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#FFF8F8] text-slate-600 hover:bg-rose-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History & Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('soap')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                activeTab === 'soap'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#FFF8F8] text-slate-600 hover:bg-rose-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>EHR SOAP Report</span>
            </button>
          </div>

          {/* Active Clinician Profile Badge */}
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-rose-100 text-slate-600">
            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">
              DR
            </div>
            <span className="text-[11px] font-medium text-slate-700">Dr. Alexandra Vance, MD</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
