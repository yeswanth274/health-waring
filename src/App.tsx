/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  PatientData,
  CounterfactualScenario,
} from './types/clinical';
import {
  predictCardiovascularRisk,
  PRESET_PATIENTS,
  getPatientHistory,
} from './lib/mlEngine';
import { Navbar, NavTab } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardOverview } from './components/DashboardOverview';
import { PatientIntakeForm } from './components/PatientIntakeForm';
import { RiskStratificationCard } from './components/RiskStratificationCard';
import { ShapWaterfallChart } from './components/ShapWaterfallChart';
import { CounterfactualEngine } from './components/CounterfactualEngine';
import { RiskTrendChart } from './components/RiskTrendChart';
import { SoapNoteSection } from './components/SoapNoteSection';
import { ModelAuditModal } from './components/ModelAuditModal';
import { NewPatientModal } from './components/NewPatientModal';
import { PresetPatient } from './types/clinical';
import {
  AlertTriangle,
  Heart,
  Sliders,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Check,
} from 'lucide-react';

export default function App() {
  // Active patients list initialized with presets
  const [patients, setPatients] = useState<PresetPatient[]>(PRESET_PATIENTS);
  // Initialize with Robert M. (Tier-3 Critical Alert for rich clinical demonstration)
  const [patient, setPatient] = useState<PatientData>(PRESET_PATIENTS[0].data);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState<boolean>(false);
  const [counterfactualForSoap, setCounterfactualForSoap] = useState<CounterfactualScenario | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Machine Learning Inference
  const prediction = predictCardiovascularRisk(patient);

  // Multi-encounter longitudinal history
  const history = getPatientHistory(patient, prediction.riskProbability);

  const handleSelectPreset = (preset: PatientData) => {
    setPatient({ ...preset });
    setCounterfactualForSoap(null);
  };

  const handleAddNewPatient = (newPatient: PatientData) => {
    const initialRisk = predictCardiovascularRisk(newPatient);
    const newPreset: PresetPatient = {
      id: `pt-${Date.now()}`,
      badge: initialRisk.tierLabel,
      title: `${newPatient.name}, ${newPatient.age}${newPatient.sex === 'male' ? 'M' : 'F'}`,
      description: `Custom patient registered via in-clinic intake. Initial risk: ${(initialRisk.riskProbability * 100).toFixed(1)}%.`,
      data: newPatient,
    };

    setPatients((prev) => [newPreset, ...prev]);
    setPatient(newPatient);
    setActiveTab('assessment');
    setToastMessage(`Patient "${newPatient.name}" created and loaded into Health Assessment!`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleReset = () => {
    // Reset to healthy baseline (Marcus T.)
    setPatient({ ...PRESET_PATIENTS[2].data });
    setCounterfactualForSoap(null);
  };

  const handleRecalculate = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F9] text-slate-800 flex flex-col font-sans selection:bg-rose-500/20 selection:text-rose-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentPatient={patient}
        patients={patients}
        onSelectPreset={handleSelectPreset}
        onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
        onReset={handleReset}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        {activeTab === 'landing' ? (
          <LandingPage
            onStartAssessment={() => setActiveTab('assessment')}
            onOpenDashboard={() => setActiveTab('dashboard')}
            onSelectPatient={(id) => {
              const found = PRESET_PATIENTS.find((p) => p.id === id);
              if (found) handleSelectPreset(found.data);
              setActiveTab('dashboard');
            }}
          />
        ) : (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Early-Warning Critical Alert Banner (Shown if Tier-3 Critical Alert) */}
            {prediction.tier === 'tier3_critical' && (
              <div className="bg-rose-50 border border-rose-300 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between text-xs text-rose-900 gap-3 shadow-crimson-subtle animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <strong className="text-rose-950 font-black uppercase tracking-wide text-sm block">
                      Early-Warning Critical Alert Activated ({(prediction.riskProbability * 100).toFixed(1)}% ASCVD Risk)
                    </strong>
                    <p className="text-rose-800 text-xs mt-0.5 font-medium">
                      High-risk triage protocol engaged. Physician-led evaluation and counterfactual simulation recommended.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('insights')}
                  className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-crimson-button transition cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Simulate Treatment Target</span>
                </button>
              </div>
            )}

            {/* View 1: Main Dashboard Overview */}
            {activeTab === 'dashboard' && (
              <DashboardOverview
                patient={patient}
                prediction={prediction}
                history={history}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenAudit={() => setIsAuditModalOpen(true)}
                onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
              />
            )}

            {/* View 2: Health Assessment Form & Instant AI Evaluation */}
            {activeTab === 'assessment' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-crimson-card">
                  <div className="max-w-3xl space-y-1">
                    <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                      Health Assessment Intake
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      Cardiovascular & Metabolic Risk Assessment
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Enter patient hemodynamic vitals, total cholesterol, fasting glucose, and lifestyle markers. Outputs are evaluated instantly using the calibrated prediction model.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 space-y-6">
                    <PatientIntakeForm
                      patient={patient}
                      onChange={(updated) => setPatient(updated)}
                      onSubmitAssessment={handleRecalculate}
                      isSubmitting={isEvaluating}
                    />
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <RiskStratificationCard
                      prediction={prediction}
                      onNavigateWhatIf={() => setActiveTab('insights')}
                      onNavigateSoap={() => setActiveTab('soap')}
                    />

                    {/* Contributing Indicators Card */}
                    <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-crimson-card space-y-3">
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                        Real-Time Contributing Indicators
                      </h3>
                      <div className="space-y-2">
                        {prediction.shapValues.slice(0, 4).map((s) => (
                          <div
                            key={s.featureKey}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF8F8] border border-rose-100 text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-800 block">{s.featureName}</span>
                              <span className="text-[10px] text-slate-400">{s.featureValueDisplay}</span>
                            </div>
                            <span
                              className={`font-mono font-black ${
                                s.shapValue >= 0 ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {s.shapValue >= 0 ? '+' : ''}{(s.shapValue * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setActiveTab('insights')}
                        className="w-full py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs transition cursor-pointer mt-2"
                      >
                        Inspect Full TreeSHAP Waterfall →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 3: Risk Insights & TreeSHAP Waterfall + Counterfactual What-If */}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                {/* Counterfactual "What-If" Planning Engine */}
                <CounterfactualEngine
                  baselinePatient={patient}
                  baselinePrediction={prediction}
                  onApplyToPatient={(updated) => setPatient(updated)}
                  onSetCounterfactualForSoap={(scenario) => setCounterfactualForSoap(scenario)}
                  activeScenarioForSoap={counterfactualForSoap}
                />

                {/* TreeSHAP Waterfall Chart */}
                <ShapWaterfallChart prediction={prediction} />
              </div>
            )}

            {/* View 4: Longitudinal History & Multi-Encounter Trend */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <RiskTrendChart
                  history={history}
                  currentPrediction={prediction}
                  patientName={patient.name}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RiskStratificationCard
                    prediction={prediction}
                    onNavigateWhatIf={() => setActiveTab('insights')}
                    onNavigateSoap={() => setActiveTab('soap')}
                  />
                  <ShapWaterfallChart prediction={prediction} />
                </div>
              </div>
            )}

            {/* View 5: EHR SOAP Progress Note Generator */}
            {activeTab === 'soap' && (
              <div className="space-y-6">
                <SoapNoteSection
                  patient={patient}
                  prediction={prediction}
                  counterfactual={counterfactualForSoap}
                />
              </div>
            )}
          </main>
        )}
      </div>

      {/* Regulatory & SaMD Footer in Pinterest style */}
      <footer className="mt-auto border-t border-rose-100 bg-white py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
            <span className="text-slate-800 font-bold">
              HealthU • AI-Powered Early-Warning System for Disease Risk Detection
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>XGBoost + TreeSHAP</span>
            <span>•</span>
            <span>TRIPOD+AI Compliant</span>
            <span>•</span>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="text-rose-600 hover:underline font-bold cursor-pointer"
            >
              Model Audit & ROC
            </button>
          </div>
        </div>
      </footer>

      {/* Model Audit Modal */}
      <ModelAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Register New Patient Modal */}
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onSavePatient={handleAddNewPatient}
      />
    </div>
  );
}
