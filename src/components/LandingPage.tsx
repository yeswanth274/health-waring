import React from 'react';
import {
  Heart,
  Activity,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Sliders,
  FileText,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Users,
} from 'lucide-react';

interface LandingPageProps {
  onStartAssessment: () => void;
  onOpenDashboard: () => void;
  onSelectPatient: (patientId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAssessment,
  onOpenDashboard,
}) => {
  return (
    <div className="min-h-screen bg-[#FFF9F9] text-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-100/60 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Early-Warning Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/80 border border-rose-200 text-rose-900 text-xs font-semibold shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                </span>
                <span>Tier-1 Clinical Decision Support • Early-Warning AI</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Your Health.{' '}
                <span className="text-rose-600">Our Intelligence.</span>{' '}
                <span className="block mt-1">Earlier Warnings.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                HealthU translates routine hemodynamic vitals and metabolic panels into calibrated 10-year risk probabilities, delivers granular local explainability via game-theoretic Shapley values (TreeSHAP), and models counterfactual treatment interventions before clinical events occur.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={onStartAssessment}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-crimson-button transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-white animate-heartbeat" />
                  <span>Start Health Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenDashboard}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-rose-50/80 text-slate-800 font-semibold text-sm border border-rose-200/80 shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4 text-rose-600" />
                  <span>Open Clinical Dashboard</span>
                </button>
              </div>

              {/* Clinical Trust Markers */}
              <div className="pt-6 border-t border-rose-100 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>TRIPOD+AI Compliant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Validation ROC-AUC 0.814 (≥0.75 Req)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>5–10 Year Preventive Window</span>
                </div>
              </div>
            </div>

            {/* Right Healthcare Card Visual inspired by Pinterest Reference */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-crimson-card border border-rose-100 space-y-5">
                {/* Top Patient Header in Card */}
                <div className="flex items-center justify-between border-b border-rose-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-md">
                      <Heart className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Cardiovascular Risk Core</h3>
                      <p className="text-xs text-rose-600 font-medium">Early Warning Monitor</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    Live Model Active
                  </span>
                </div>

                {/* Animated Heartbeat SVG Graphic */}
                <div className="relative h-28 bg-[#FFF4F5] rounded-2xl p-3 flex flex-col justify-between overflow-hidden border border-rose-100/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-950 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-rose-600" />
                      Arterial Shear & Pulse Pressure
                    </span>
                    <span className="font-mono font-bold text-rose-700">72 bpm • 124/78</span>
                  </div>

                  {/* Heartbeat pulse path */}
                  <svg className="w-full h-14 overflow-visible" viewBox="0 0 320 60">
                    <path
                      d="M 0 30 L 70 30 L 85 10 L 95 50 L 105 20 L 115 35 L 125 30 L 200 30 L 215 8 L 225 52 L 235 18 L 245 35 L 255 30 L 320 30"
                      fill="none"
                      stroke="#E11D48"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Waveform Lead II</span>
                    <span>Stable Sinus Rhythm</span>
                  </div>
                </div>

                {/* Stat Pillars */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#FFFBFB] rounded-2xl border border-rose-100">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                      Cohort Baseline E[f(x)]
                    </span>
                    <span className="text-lg font-bold text-slate-900 font-mono">18.5%</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">10,000-pt Framingham</span>
                  </div>
                  <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-200">
                    <span className="text-[10px] text-rose-900 font-semibold uppercase tracking-wider block">
                      Target Intervention
                    </span>
                    <span className="text-lg font-bold text-rose-700 font-mono">ARR -40.6%</span>
                    <span className="text-[10px] text-rose-800 font-medium block mt-0.5">NNT = 3 Patients</span>
                  </div>
                </div>

                {/* Floating Feature Tag */}
                <div className="p-3 bg-white rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">TreeSHAP Explainability</span>
                      <span className="text-[10px] text-slate-500">Local Shapley feature breakdown</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-600 font-mono">∑φᵢ verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Feature Section */}
      <section className="py-16 bg-white border-y border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 uppercase tracking-wider border border-rose-200">
              Clinical Differentiators
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Beyond Black-Box Machine Learning
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              HealthU combines clinical calibration, game-theoretic interpretability, and actionable simulations to support clinician decisions without alert fatigue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#FFF9F9] rounded-3xl p-6 border border-rose-100/90 shadow-crimson-subtle space-y-3 hover:border-rose-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Calibrated Risk Stratification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Probability outputs mapped strictly into 3 actionable tiers: 🟢 Tier-1 Stable (&lt;25%), 🟡 Tier-2 Moderate (25%–50%), and 🔴 Tier-3 Critical Alert (&gt;50%).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#FFF9F9] rounded-3xl p-6 border border-rose-100/90 shadow-crimson-subtle space-y-3 hover:border-rose-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">TreeSHAP Explainability</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interactive waterfall charts break down the exact positive and negative contributors (+32% SBP, -4% Non-smoker) relative to cohort baseline expectation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#FFF9F9] rounded-3xl p-6 border border-rose-100/90 shadow-crimson-subtle space-y-3 hover:border-rose-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Counterfactual "What-If" Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Simulate treatment targets (titrating SBP to ≤125 mmHg or starting statins) to show patients their projected Absolute Risk Reduction and NNT.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#FFF9F9] rounded-3xl p-6 border border-rose-100/90 shadow-crimson-subtle space-y-3 hover:border-rose-300 transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Automated EHR SOAP Generator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instantly compiles inputs, risk scores, TreeSHAP attributions, and clinical plans into standard Subjective, Objective, Assessment, Plan notes for EHR clipboard transfer.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
