import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  History,
  Calendar,
  Activity,
  Layers,
  Heart,
  FileCheck2,
} from 'lucide-react';
import { VisitHistoryItem, RiskPrediction } from '../types/clinical';
import { BASELINE_COHORT_RISK } from '../lib/mlEngine';

interface RiskTrendChartProps {
  history: VisitHistoryItem[];
  currentPrediction: RiskPrediction;
  patientName: string;
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({
  history,
  patientName,
}) => {
  const [metricOverlay, setMetricOverlay] = useState<'risk_only' | 'overlay_sbp' | 'overlay_chol'>('risk_only');

  if (!history || history.length === 0) return null;

  const chartData = history.map((item) => ({
    ...item,
    formattedDate: `${item.visitDate}`,
    formattedRisk: item.riskScore,
    baselineRisk: Number((BASELINE_COHORT_RISK * 100).toFixed(1)),
  }));

  const firstVisit = chartData[0];
  const lastVisit = chartData[chartData.length - 1];
  const trajectoryDelta = Number((lastVisit.formattedRisk - firstVisit.formattedRisk).toFixed(1));
  const isEscalating = trajectoryDelta > 0;

  // Recharts Custom Tooltip with Pinterest healthcare aesthetic
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: VisitHistoryItem = payload[0].payload;
      const isCurrent = data.isCurrent;

      return (
        <div className="bg-white border border-rose-200 p-4 rounded-2xl shadow-xl text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-rose-100 pb-2">
            <div>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                {data.visitDate}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {data.visitLabel} {isCurrent && '• (Current)'}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                data.tier === 'tier3_critical'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : data.tier === 'tier2_moderate'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              {data.tier === 'tier3_critical' ? 'Tier-3' : data.tier === 'tier2_moderate' ? 'Tier-2' : 'Tier-1'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">10-Yr CVD Risk:</span>
              <span
                className={`font-mono font-black text-sm ${
                  data.riskScore >= 50
                    ? 'text-rose-600'
                    : data.riskScore >= 25
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                }`}
              >
                {data.riskScore}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-rose-100 text-[11px] font-mono text-slate-700">
              <div>BP: <span className="font-bold text-slate-900">{data.sbp}/{data.dbp}</span></div>
              <div>Chol: <span className="font-bold text-slate-900">{data.totalChol}</span> mg/dL</div>
              <div>Gluc: <span className="font-bold text-slate-900">{data.fastingGluc}</span> mg/dL</div>
              <div>Tobacco: <span className="font-bold text-slate-900">{data.tobacco === 1 ? 'Smoker' : 'None'}</span></div>
            </div>
          </div>

          {data.interventionNote && (
            <div className="pt-2 border-t border-rose-100 text-[10px] text-slate-600 italic">
              <span className="text-slate-900 not-italic font-bold block">Encounter Note:</span>
              "{data.interventionNote}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-crimson-card border border-rose-100 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-50 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
                Longitudinal Risk Probability Trend
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Multi-encounter progression ({history.length} visits for {patientName})
              </p>
            </div>
          </div>
        </div>

        {/* Metric Overlay Pills */}
        <div className="flex items-center gap-1.5 bg-[#FFF6F7] p-1 rounded-full border border-rose-200 text-xs font-bold">
          <button
            onClick={() => setMetricOverlay('risk_only')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              metricOverlay === 'risk_only'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Risk %
          </button>
          <button
            onClick={() => setMetricOverlay('overlay_sbp')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              metricOverlay === 'overlay_sbp'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + SBP (mmHg)
          </button>
          <button
            onClick={() => setMetricOverlay('overlay_chol')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              metricOverlay === 'overlay_chol'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Chol (mg/dL)
          </button>
        </div>
      </div>

      {/* Trajectory Insight Banner */}
      <div className="flex flex-wrap items-center justify-between bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 text-xs gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              isEscalating
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            {isEscalating ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-slate-600 font-medium">Longitudinal Trajectory: </span>
            <strong className={isEscalating ? 'text-rose-700 font-mono font-bold' : 'text-emerald-700 font-mono font-bold'}>
              {isEscalating ? `+${trajectoryDelta}% Escalation` : `${trajectoryDelta}% Reduction`}
            </strong>
            <span className="text-slate-400 text-[11px] ml-1">
              ({firstVisit.riskScore}% at {firstVisit.visitDate} → {lastVisit.riskScore}% current)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5 text-rose-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            ASCVD Risk %
          </span>
          {metricOverlay === 'overlay_sbp' && (
            <span className="flex items-center gap-1.5 text-slate-800 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              SBP (mmHg)
            </span>
          )}
          {metricOverlay === 'overlay_chol' && (
            <span className="flex items-center gap-1.5 text-amber-700 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Chol (mg/dL)
            </span>
          )}
          <span className="text-slate-400 border-l border-rose-200 pl-2">
            Base: 18.5%
          </span>
        </div>
      </div>

      {/* Recharts Chart Container */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#FEE2E2" vertical={false} />

            <XAxis
              dataKey="formattedDate"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#FCA5A5' }}
            />

            <YAxis
              yAxisId="left"
              domain={[0, Math.max(70, Math.ceil(Math.max(...chartData.map((d) => d.formattedRisk)) / 10) * 10 + 10)]}
              stroke="#94A3B8"
              fontSize={11}
              tickFormatter={(val) => `${val}%`}
              tickLine={false}
              axisLine={{ stroke: '#FCA5A5' }}
            />

            {metricOverlay !== 'risk_only' && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={metricOverlay === 'overlay_sbp' ? [80, 200] : [120, 320]}
                stroke={metricOverlay === 'overlay_sbp' ? '#E11D48' : '#F59E0B'}
                fontSize={11}
                tickFormatter={(val) => `${val}`}
                tickLine={false}
                axisLine={{ stroke: '#FCA5A5' }}
              />
            )}

            {/* Reference Threshold Lines */}
            <ReferenceLine
              yAxisId="left"
              y={50}
              stroke="#E11D48"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Tier-3 Critical Alert (≥50%)',
                position: 'insideTopRight',
                fill: '#E11D48',
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: 'bold',
              }}
            />

            <ReferenceLine
              yAxisId="left"
              y={25}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Tier-2 Moderate (25%)',
                position: 'insideTopRight',
                fill: '#F59E0B',
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: 'bold',
              }}
            />

            <ReferenceLine
              yAxisId="left"
              y={18.5}
              stroke="#94A3B8"
              strokeDasharray="2 2"
              strokeWidth={1.2}
              label={{
                value: 'Baseline 18.5%',
                position: 'insideBottomRight',
                fill: '#64748B',
                fontSize: 10,
                fontFamily: 'monospace',
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="formattedRisk"
              stroke="#E11D48"
              strokeWidth={3}
              dot={{ r: 5, fill: '#E11D48', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#BE123C', stroke: '#ffffff', strokeWidth: 2 }}
            />

            {metricOverlay === 'overlay_sbp' && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sbp"
                stroke="#1E293B"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 3.5, fill: '#1E293B' }}
              />
            )}

            {metricOverlay === 'overlay_chol' && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalChol"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 3.5, fill: '#F59E0B' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Historical Milestones */}
      <div className="pt-2 border-t border-rose-100">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Milestone Encounters:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {history.map((h, idx) => (
            <div
              key={h.id || idx}
              className={`p-3 rounded-2xl border text-xs space-y-1 transition ${
                h.isCurrent
                  ? 'bg-rose-50/80 border-rose-300 shadow-xs'
                  : 'bg-[#FFF9F9] border-rose-100'
              }`}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-mono text-slate-500 font-semibold">{h.visitDate}</span>
                {h.isCurrent ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                    Current
                  </span>
                ) : (
                  <span className="text-slate-400 font-mono">{h.visitLabel}</span>
                )}
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <span
                  className={`font-mono font-black text-sm ${
                    h.riskScore >= 50
                      ? 'text-rose-600'
                      : h.riskScore >= 25
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                  }`}
                >
                  {h.riskScore}%
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {h.sbp}/{h.dbp} mmHg
                </span>
              </div>
              {h.interventionNote && (
                <p className="text-[10px] text-slate-500 truncate font-sans">
                  {h.interventionNote}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
