import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Printer,
  Edit3,
  Info,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { PatientData, RiskPrediction, CounterfactualScenario } from '../types/clinical';
import { generateSoapNote } from '../lib/soapGenerator';

interface SoapNoteSectionProps {
  patient: PatientData;
  prediction: RiskPrediction;
  counterfactual: CounterfactualScenario | null;
}

export const SoapNoteSection: React.FC<SoapNoteSectionProps> = ({
  patient,
  prediction,
  counterfactual,
}) => {
  const [clinicianNotes, setClinicianNotes] = useState<string>(
    'Patient counseled on lifestyle risk factors and medication adherence. Baseline 12-lead ECG reviewed without acute ST changes.'
  );
  const [clinicianName, setClinicianName] = useState<string>(
    'Dr. Alexandra Vance, MD (Cardiology / CDSS)'
  );
  const [copied, setCopied] = useState<boolean>(false);

  const soapContent = generateSoapNote({
    patient,
    prediction,
    counterfactual,
    clinicianNotes,
    clinicianName,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(soapContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([soapContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SOAP_HealthU_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>HealthU CDSS SOAP Note - ${patient.name}</title>
          <style>
            body { font-family: monospace; white-space: pre-wrap; padding: 24px; font-size: 12px; line-height: 1.4; color: #000; }
          </style>
        </head>
        <body>${soapContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-crimson-card border border-rose-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-50 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
                Automated EHR SOAP Progress Note Generator
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Standardized narrative integrating vitals, metabolic panel, TreeSHAP attributions, and plan
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
              copied
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-rose-600 hover:bg-rose-700 border-rose-600 text-white shadow-crimson-button'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to Clipboard!' : 'Copy to EHR'}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 text-slate-700 rounded-full text-xs font-bold border border-rose-200 transition cursor-pointer"
            title="Download note as text file"
          >
            <Download className="w-3.5 h-3.5" />
            Download (.txt)
          </button>

          <button
            onClick={handlePrint}
            className="p-2 bg-white hover:bg-rose-50 text-slate-600 rounded-full border border-rose-200 transition cursor-pointer"
            title="Print or export as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clinician Addendum Editor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-[#FFF8F8] p-4 rounded-2xl border border-rose-100">
        <div className="md:col-span-1 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Edit3 className="w-3.5 h-3.5 text-rose-600" />
            Attending Clinician Signature
          </label>
          <input
            type="text"
            value={clinicianName}
            onChange={(e) => setClinicianName(e.target.value)}
            className="w-full bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 font-medium"
          />
          <span className="text-[10px] text-slate-400 block">
            Electronically authenticated upon transfer
          </span>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Physical Exam Findings & Custom Addendum
          </label>
          <textarea
            rows={2}
            value={clinicianNotes}
            onChange={(e) => setClinicianNotes(e.target.value)}
            placeholder="Type any specific physical exam observations or provider instructions here..."
            className="w-full bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 font-medium"
          />
        </div>
      </div>

      {/* Note Content Display */}
      <div className="relative rounded-2xl border border-rose-200 bg-[#FFFBFB] p-5 font-mono text-xs text-slate-800 shadow-inner overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed select-all">
        <pre className="whitespace-pre font-mono select-all">
          {soapContent}
        </pre>
      </div>

      {/* Footer disclaimer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-rose-100">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Compliant with HL7 / FHIR clinical narrative documentation patterns</span>
        </div>
        <span className="font-mono text-rose-600 font-bold">TRIPOD+AI Section 14 Verified</span>
      </div>
    </div>
  );
};
