import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  Sliders,
  FileText,
  Heart,
} from 'lucide-react';
import { RiskPrediction } from '../types/clinical';

interface RiskStratificationCardProps {
  prediction: RiskPrediction;
  onNavigateWhatIf: () => void;
  onNavigateSoap: () => void;
}

export const RiskStratificationCard: React.FC<RiskStratificationCardProps> = ({
  prediction,
  onNavigateWhatIf,
  onNavigateSoap,
}) => {
  const riskPct = (prediction.riskProbability * 100).toFixed(1);
  const baselinePct = (prediction.baseValue * 100).toFixed(1);
  const diffPct = ((prediction.riskProbability - prediction.baseValue) * 100).toFixed(1);
  const isAboveBaseline = prediction.riskProbability >= prediction.baseValue;

  // Semicircular gauge coordinates
  const radius = 70;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference - (prediction.riskProbability * circumference);

  const getTierDetails = () => {
    switch (prediction.tier) {
      case 'tier3_critical':
        return {
          icon: <AlertOctagon className="w-5 h-5 text-rose-600 animate-pulse" />,
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
          gaugeStroke: '#E11D48',
          bgHighlight: 'bg-rose-50/70',
        };
      case 'tier2_moderate':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          gaugeStroke: '#F59E0B',
          bgHighlight: 'bg-amber-50/50',
        };
      case 'tier1_stable':
      default:
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          gaugeStroke: '#10B981',
          bgHighlight: 'bg-emerald-50/50',
        };
    }
  };

  const tierInfo = getTierDetails();

  return (
    <div className="bg-white rounded-3xl p-6 shadow-crimson-card border border-rose-100 relative overflow-hidden space-y-5">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50/60 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Tier Badge & Action Directive */}
        <div className="space-y-3.5 max-w-xl">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${tierInfo.badgeClass}`}
            >
              {tierInfo.icon}
              {prediction.tierLabel}
            </span>

            <span className="text-xs font-semibold text-slate-500">
              {prediction.tierSubtitle}
            </span>
          </div>

          <div>
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
              Clinical Action Directive:
            </h3>
            <p className="text-sm font-semibold text-slate-900 mt-1 leading-relaxed">
              {prediction.clinicalActionDirective}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-1.5 font-mono bg-[#FFF8F8] px-3 py-1.5 rounded-full border border-rose-100 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>Recommended Follow-up:</span>
              <strong className="text-slate-900 font-bold">{prediction.followUpWindow}</strong>
            </div>

            <div className="flex items-center gap-1.5 font-mono bg-[#FFF8F8] px-3 py-1.5 rounded-full border border-rose-100 text-slate-700">
              {isAboveBaseline ? (
                <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Cohort Delta:</span>
              <strong className={isAboveBaseline ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                {isAboveBaseline ? `+${diffPct}%` : `${diffPct}%`}
              </strong>
              <span className="text-slate-400 text-[10px]">(vs {baselinePct}% base)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Semi-Circular Gauge & Risk Probability */}
        <div className="flex flex-col items-center justify-center shrink-0 bg-[#FFF8F8] p-4 rounded-3xl border border-rose-100/90 min-w-[210px] shadow-xs">
          <div className="relative w-44 h-24 flex items-end justify-center">
            {/* SVG Semicircle Gauge */}
            <svg className="w-44 h-24 overflow-visible" viewBox="0 0 160 85">
              {/* Background Arc */}
              <path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke="#FEE2E2"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Dynamic Risk Arc */}
              <path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke={tierInfo.gaugeStroke}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />

              {/* Threshold Ticks */}
              <circle cx="45" cy="30" r="2.5" fill="#F59E0B" />
              <circle cx="80" cy="10" r="2.5" fill="#E11D48" />
            </svg>

            {/* Probability Value at Bottom Center */}
            <div className="absolute bottom-0 flex flex-col items-center">
              <span
                className={`text-3xl font-black font-mono tracking-tight leading-none ${
                  prediction.tier === 'tier3_critical'
                    ? 'text-rose-600'
                    : prediction.tier === 'tier2_moderate'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                }`}
              >
                {riskPct}%
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                10-Year ASCVD Risk
              </span>
            </div>
          </div>

          {/* Tier scale legend */}
          <div className="w-full mt-3 pt-2 border-t border-rose-100 flex justify-between text-[10px] font-mono text-slate-500">
            <span className="text-emerald-600 font-bold">&lt;25% Stable</span>
            <span className="text-amber-600 font-bold">25–50% Mod</span>
            <span className="text-rose-600 font-bold">&gt;50% Crit</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={onNavigateWhatIf}
              className="flex items-center justify-center gap-1 py-1.5 px-2.5 text-[11px] font-bold rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
              title="Simulate treatment target risk drops"
            >
              <Sliders className="w-3 h-3" />
              What-If Sim
            </button>
            <button
              onClick={onNavigateSoap}
              className="flex items-center justify-center gap-1 py-1.5 px-2.5 text-[11px] font-bold rounded-full bg-white hover:bg-rose-50 text-slate-700 border border-rose-200 transition cursor-pointer"
              title="View EHR SOAP Note"
            >
              <FileText className="w-3 h-3 text-rose-600" />
              SOAP Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
