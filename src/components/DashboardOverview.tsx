import React from 'react';
import {
  Heart,
  Activity,
  Droplet,
  Flame,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  FileText,
  BarChart3,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { PatientData, RiskPrediction, VisitHistoryItem } from '../types/clinical';
import { RiskStratificationCard } from './RiskStratificationCard';
import { RiskTrendChart } from './RiskTrendChart';
import { ShapWaterfallChart } from './ShapWaterfallChart';

interface DashboardOverviewProps {
  patient: PatientData;
  prediction: RiskPrediction;
  history: VisitHistoryItem[];
  onNavigateTab: (tab: 'assessment' | 'insights' | 'history' | 'soap') => void;
  onOpenAudit: () => void;
  onOpenNewPatient?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  patient,
  prediction,
  history,
  onNavigateTab,
  onOpenAudit,
  onOpenNewPatient,
}) => {
  const pulsePressure = patient.sbp - patient.dbp;
  const topRiskDriver = prediction.shapValues.find((s) => s.shapValue > 0.01) || prediction.shapValues[0];

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Header Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 rounded-3xl p-6 text-white shadow-crimson-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-rose-100 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>HealthU Decision Intelligence Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Cardiovascular Triage Overview
          </h1>
          <p className="text-rose-100 text-xs sm:text-sm max-w-xl font-medium">
            Active Record: <strong className="text-white underline">{patient.name}</strong> ({patient.age}y {patient.sex === 'male' ? 'Male' : 'Female'}) • Multi-variable calibrated risk evaluation
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 self-start md:self-auto flex-wrap">
          {onOpenNewPatient && (
            <button
              onClick={onOpenNewPatient}
              className="px-4 py-2.5 rounded-full bg-rose-900/60 hover:bg-rose-900/90 text-white font-bold text-xs border border-white/30 shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+ New Patient</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('assessment')}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-rose-50 text-rose-800 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
          >
            <Heart className="w-4 h-4 fill-rose-600" />
            <span>New Assessment</span>
          </button>
          <button
            onClick={() => onNavigateTab('insights')}
            className="px-4 py-2.5 rounded-full bg-rose-900/40 hover:bg-rose-900/60 text-white font-semibold text-xs border border-white/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>What-If Sim</span>
          </button>
        </div>
      </div>

      {/* Top 4 Quick Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 10-Yr Risk Status */}
        <div className="bg-white rounded-3xl p-5 shadow-crimson-subtle border border-rose-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              10-Year ASCVD Risk
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                prediction.tier === 'tier3_critical'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : prediction.tier === 'tier2_moderate'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              {prediction.tierLabel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black font-mono ${
                prediction.tier === 'tier3_critical'
                  ? 'text-rose-600'
                  : prediction.tier === 'tier2_moderate'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
              }`}
            >
              {(prediction.riskProbability * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">calibrated</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Base Cohort E[f(x)]: 18.5%
          </span>
        </div>

        {/* Card 2: Hemodynamics */}
        <div className="bg-white rounded-3xl p-5 shadow-crimson-subtle border border-rose-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Hemodynamics
            </span>
            <Activity className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900">
              {patient.sbp}/{patient.dbp}
            </span>
            <span className="text-xs text-slate-400">mmHg</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>PP: {pulsePressure} mmHg</span>
            <span>MAP: {Math.round(patient.dbp + pulsePressure / 3)}</span>
          </div>
        </div>

        {/* Card 3: Metabolic Panel */}
        <div className="bg-white rounded-3xl p-5 shadow-crimson-subtle border border-rose-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Metabolic Panel
            </span>
            <Droplet className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold font-mono text-slate-900">{patient.totalChol}</span>
              <span className="text-[10px] text-slate-400 ml-1">Chol</span>
            </div>
            <div>
              <span className="text-xl font-bold font-mono text-slate-900">{patient.fastingGluc}</span>
              <span className="text-[10px] text-slate-400 ml-1">Gluc</span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span className="capitalize">{patient.totalCholCategory}</span>
            <span className="capitalize">{patient.fastingGlucCategory}</span>
          </div>
        </div>

        {/* Card 4: Top Early-Warning Driver */}
        <div className="bg-white rounded-3xl p-5 shadow-crimson-subtle border border-rose-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Primary Driver (TreeSHAP)
            </span>
            <Sparkles className="w-4 h-4 text-rose-600" />
          </div>
          <div className="truncate">
            <span className="font-bold text-sm text-slate-900 block truncate">
              {topRiskDriver.featureName}
            </span>
            <span className="text-xs font-mono font-bold text-rose-600">
              {topRiskDriver.shapValue >= 0 ? '+' : ''}{(topRiskDriver.shapValue * 100).toFixed(1)}% contribution
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {topRiskDriver.featureValueDisplay}
          </span>
        </div>
      </div>

      {/* Main Grid: Stratification Card + Longitudinal Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (5 Cols): Stratification Gauge */}
        <div className="lg:col-span-5 space-y-6">
          <RiskStratificationCard
            prediction={prediction}
            onNavigateWhatIf={() => onNavigateTab('insights')}
            onNavigateSoap={() => onNavigateTab('soap')}
          />

          {/* Quick Shortcuts Card */}
          <div className="bg-white rounded-3xl p-5 shadow-crimson-card border border-rose-100 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Clinical Action Navigation
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => onNavigateTab('assessment')}
                className="p-3 bg-[#FFF8F8] hover:bg-rose-50 rounded-2xl border border-rose-200/80 text-slate-800 flex flex-col justify-between transition cursor-pointer text-left"
              >
                <span>Edit Parameters</span>
                <span className="text-[10px] text-rose-600 font-medium mt-1">Adjust Vitals & Labs →</span>
              </button>

              <button
                onClick={() => onNavigateTab('insights')}
                className="p-3 bg-[#FFF8F8] hover:bg-rose-50 rounded-2xl border border-rose-200/80 text-slate-800 flex flex-col justify-between transition cursor-pointer text-left"
              >
                <span>TreeSHAP Insights</span>
                <span className="text-[10px] text-rose-600 font-medium mt-1">View Waterfall Plot →</span>
              </button>

              <button
                onClick={() => onNavigateTab('history')}
                className="p-3 bg-[#FFF8F8] hover:bg-rose-50 rounded-2xl border border-rose-200/80 text-slate-800 flex flex-col justify-between transition cursor-pointer text-left"
              >
                <span>Multi-Visit Trend</span>
                <span className="text-[10px] text-rose-600 font-medium mt-1">Review Encounters →</span>
              </button>

              <button
                onClick={() => onNavigateTab('soap')}
                className="p-3 bg-[#FFF8F8] hover:bg-rose-50 rounded-2xl border border-rose-200/80 text-slate-800 flex flex-col justify-between transition cursor-pointer text-left"
              >
                <span>EHR SOAP Note</span>
                <span className="text-[10px] text-rose-600 font-medium mt-1">Export Documentation →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right (7 Cols): Longitudinal Trend Chart */}
        <div className="lg:col-span-7 space-y-6">
          <RiskTrendChart
            history={history}
            currentPrediction={prediction}
            patientName={patient.name}
          />
        </div>
      </div>

      {/* TreeSHAP Local Waterfall Section */}
      <div className="pt-2">
        <ShapWaterfallChart prediction={prediction} />
      </div>
    </div>
  );
};
