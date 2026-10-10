import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  Table as TableIcon,
  Info,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { RiskPrediction, ShapAttribution } from '../types/clinical';

interface ShapWaterfallChartProps {
  prediction: RiskPrediction;
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({
  prediction,
}) => {
  const [viewMode, setViewMode] = useState<'waterfall' | 'table'>('waterfall');
  const [hoveredFeature, setHoveredFeature] = useState<ShapAttribution | null>(null);

  const baseVal = prediction.baseValue; // 0.185 (18.5%)
  const finalVal = prediction.riskProbability;

  // Running cumulative steps for waterfall
  let currentCum = baseVal;
  const waterfallSteps = prediction.shapValues.map((item) => {
    const startVal = currentCum;
    const endVal = currentCum + item.shapValue;
    currentCum = endVal;
    return {
      ...item,
      startVal,
      endVal,
      isPositive: item.shapValue >= 0,
    };
  });

  const allValues = [
    baseVal,
    finalVal,
    ...waterfallSteps.map((s) => s.startVal),
    ...waterfallSteps.map((s) => s.endVal),
  ];
  const minVal = Math.max(0, Math.min(...allValues) - 0.05);
  const maxVal = Math.min(1.0, Math.max(...allValues) + 0.08);
  const valRange = maxVal - minVal || 1;

  const toPercent = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return ((clamped - minVal) / valRange) * 100;
  };

  const basePos = toPercent(baseVal);
  const finalPos = toPercent(finalVal);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-crimson-card border border-rose-100 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-50 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
                Local Explainability (TreeSHAP Waterfall)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Game-Theoretic Decomposition: E[f(x)] 18.5% → f(x) {(finalVal * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle pills */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#FFF6F7] p-1 rounded-full border border-rose-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('waterfall')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition cursor-pointer ${
                viewMode === 'waterfall'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Waterfall
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Explanatory banner */}
      <div className="flex flex-wrap items-center justify-between bg-[#FFF8F8] p-3.5 rounded-2xl border border-rose-100 text-xs gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="text-slate-700">
            Cohort Baseline Expectation <strong className="text-rose-700 font-mono">E[f(x)] = {(baseVal * 100).toFixed(1)}%</strong>
          </span>
          <span className="text-slate-400 font-mono">→</span>
          <span className="text-slate-700">
            Model Prediction <strong className="font-mono text-slate-900">f(x) = {(finalVal * 100).toFixed(1)}%</strong>
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block" />
            + Risk Elevating
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" />
            - Protective
          </span>
          <span className="text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-full border border-rose-200 font-bold">
            ∑φᵢ = f(x) - E[f(x)]
          </span>
        </div>
      </div>

      {/* View: Waterfall Chart */}
      {viewMode === 'waterfall' ? (
        <div className="space-y-4 pt-1">
          {/* Axis markers */}
          <div className="relative h-6 text-[10px] font-mono text-slate-400 border-b border-rose-100">
            <div
              className="absolute transform -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${basePos}%` }}
            >
              <span className="text-rose-700 font-bold">Base {(baseVal * 100).toFixed(1)}%</span>
              <div className="w-0.5 h-2 bg-rose-600" />
            </div>
            <div
              className="absolute transform -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${finalPos}%` }}
            >
              <span className="text-slate-900 font-bold">Risk {(finalVal * 100).toFixed(1)}%</span>
              <div className="w-0.5 h-2 bg-slate-900" />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2 relative">
            {/* Guide lines */}
            <div
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-rose-300 pointer-events-none z-0"
              style={{ left: `${basePos}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-slate-300 pointer-events-none z-0"
              style={{ left: `${finalPos}%` }}
            />

            {waterfallSteps.map((step, idx) => {
              const startX = toPercent(step.startVal);
              const endX = toPercent(step.endVal);
              const leftPos = Math.min(startX, endX);
              const barWidth = Math.max(0.8, Math.abs(endX - startX));
              const shapPct = (step.shapValue * 100).toFixed(1);

              return (
                <div
                  key={step.featureKey}
                  onMouseEnter={() => setHoveredFeature(step)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="group relative flex flex-col sm:flex-row sm:items-center text-xs gap-2 py-1.5 px-3 rounded-2xl hover:bg-rose-50/70 transition cursor-pointer"
                >
                  {/* Feature Label */}
                  <div className="sm:w-64 shrink-0 flex items-center justify-between text-slate-700">
                    <span className="font-bold truncate text-slate-800 group-hover:text-rose-900">
                      {step.featureName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 ml-2">
                      {step.featureValueDisplay}
                    </span>
                  </div>

                  {/* Horizontal Bar Visualizer */}
                  <div className="relative flex-1 h-6 bg-[#FFF4F5] rounded-full border border-rose-100 flex items-center px-1">
                    <div
                      className={`absolute h-4 rounded-full transition-all duration-300 shadow-xs flex items-center px-1.5 ${
                        step.isPositive
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                      style={{
                        left: `${leftPos}%`,
                        width: `${barWidth}%`,
                        minWidth: '8px',
                      }}
                    />

                    {/* Connecting bridge */}
                    {idx > 0 && (
                      <div
                        className="absolute h-0 border-t border-dashed border-rose-300 pointer-events-none"
                        style={{
                          left: `${Math.min(toPercent(waterfallSteps[idx - 1].endVal), startX)}%`,
                          width: `${Math.abs(startX - toPercent(waterfallSteps[idx - 1].endVal))}%`,
                        }}
                      />
                    )}
                  </div>

                  {/* Attribution Delta */}
                  <div className="sm:w-24 text-right shrink-0 font-mono font-black text-xs">
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        step.isPositive ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {step.isPositive ? '+' : ''}
                      {shapPct}%
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Final outcome row */}
            <div className="pt-2 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center text-xs gap-2 py-1.5 px-3 font-mono">
              <div className="sm:w-64 shrink-0 flex items-center justify-between text-slate-900 font-extrabold">
                <span>Final Calibrated Risk f(x)</span>
                <span className="text-slate-400 font-normal">10-Year ASCVD</span>
              </div>
              <div className="relative flex-1 h-6 bg-[#FFF4F5] rounded-full border border-rose-100 flex items-center px-1">
                <div
                  className={`absolute h-4 rounded-full font-bold px-2 flex items-center transition-all ${
                    prediction.tier === 'tier3_critical'
                      ? 'bg-rose-600 text-white'
                      : prediction.tier === 'tier2_moderate'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-500 text-white'
                  }`}
                  style={{
                    left: `${toPercent(0)}%`,
                    width: `${finalPos}%`,
                  }}
                />
              </div>
              <div className="sm:w-24 text-right shrink-0 font-black text-slate-900 text-sm">
                {(finalVal * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Interactive Mechanism Card */}
          {hoveredFeature ? (
            <div className="mt-3 p-3.5 rounded-2xl bg-[#FFF8F8] border border-rose-200 text-xs animate-fadeIn">
              <div className="flex items-center justify-between text-slate-900 mb-1">
                <span className="font-bold flex items-center gap-1.5 text-rose-900">
                  <Info className="w-3.5 h-3.5 text-rose-600" />
                  {hoveredFeature.featureName}: {hoveredFeature.featureValueDisplay}
                </span>
                <span
                  className={`font-mono font-black ${
                    hoveredFeature.shapValue >= 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  Shapley Attribution: {hoveredFeature.shapValue >= 0 ? '+' : ''}
                  {(hoveredFeature.shapValue * 100).toFixed(2)}%
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed font-normal">
                <strong className="text-slate-800 font-semibold">Clinical Mechanism: </strong>
                {hoveredFeature.clinicalMechanism}
              </p>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 italic text-center py-1">
              Hover over any feature bar above to view exact clinical mechanism & TreeSHAP breakdown.
            </div>
          )}
        </div>
      ) : (
        /* View: Table */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8F8] text-slate-500 uppercase font-mono text-[10px] border-b border-rose-100">
              <tr>
                <th className="py-2.5 px-3">Risk Factor</th>
                <th className="py-2.5 px-3">Patient Value</th>
                <th className="py-2.5 px-3">Cohort Baseline</th>
                <th className="py-2.5 px-3 text-right">TreeSHAP φᵢ</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3">Clinical Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 font-sans">
              {prediction.shapValues.map((item) => (
                <tr key={item.featureKey} className="hover:bg-rose-50/50 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    {item.featureName}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-900 font-semibold">
                    {item.featureValueDisplay}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {item.baseValue}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-black text-right">
                    <span className={item.shapValue >= 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {item.shapValue >= 0 ? '+' : ''}
                      {(item.shapValue * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.shapValue >= 0
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {item.shapValue >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {item.shapValue >= 0 ? 'Elevating' : 'Protective'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs truncate">
                    {item.clinicalMechanism}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
