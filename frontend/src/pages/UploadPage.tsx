import React, { useState } from 'react';
import { UploadCloud, FileText, AlertCircle, Sparkles, Check, ArrowRight, Shield } from 'lucide-react';
import { api, AnalysisResponse } from '../api/client';

interface UploadPageProps {
  onAnalysisStarted: (analysisData: AnalysisResponse) => void;
  language: string;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onAnalysisStarted, language }) => {
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterFile || !policyFile) {
      setErrorMsg('Please upload both the rejection letter and the policy wording PDF.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const { analysis_id } = await api.startAnalysis(letterFile, policyFile, language);
      const data = await api.getAnalysis(analysis_id);
      onAnalysisStarted(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoCase = async (demoId: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const data = await api.getAnalysis(demoId);
      onAnalysisStarted(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load demo case.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Hero Heading */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Patient-Side InsurTech Advocate · Free for Individuals</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contest an Unjust Health Insurance Claim Rejection
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Upload your rejection letter and policy wording. Pratikar locates the cited clause verbatim, tests it against coded IRDAI regulations, and drafts a ready-to-file appeal.
        </p>
      </div>

      {/* Pre-cached Demo Cases Selector (<5s demo guarantee) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Demo Day Fast Path (Instant Verification)
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">&lt; 5s Response Time</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-1-strong-moratorium')}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-left transition-all group"
          >
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Flow A: Strong Verdict</div>
            <div className="text-xs font-semibold mt-1 text-slate-100 group-hover:text-white">
              60-Month Moratorium Violation
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Pre-existing disease rejection after 65 months</div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-2-weak-valid-rejection')}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-left transition-all group"
          >
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Flow B: Weak Verdict</div>
            <div className="text-xs font-semibold mt-1 text-slate-100 group-hover:text-white">
              Valid Rejection (30-Day Limit)
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Honest decline; no pointless appeal generated</div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-3-vague-no-clause')}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-left transition-all group"
          >
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">Flow C: Clause-less</div>
            <div className="text-xs font-semibold mt-1 text-slate-100 group-hover:text-white">
              Vague Letter (No Clause)
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Generates Request-for-Grounds letter</div>
          </button>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleFileUpload} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File 1: Rejection Letter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Rejection Letter (Photo or PDF) <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                id="rejectionLetter"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setLetterFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="rejectionLetter" className="cursor-pointer block space-y-2">
                <UploadCloud className="w-8 h-8 text-brand-600 mx-auto" />
                <div className="text-xs sm:text-sm font-semibold text-slate-700">
                  {letterFile ? letterFile.name : 'Choose file or drag & drop'}
                </div>
                <div className="text-[11px] text-slate-500">PDF, JPG, or PNG (Max 25 MB)</div>
              </label>
            </div>
          </div>

          {/* File 2: Policy Wording */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Policy Wording PDF <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                id="policyWording"
                accept=".pdf"
                onChange={(e) => setPolicyFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="policyWording" className="cursor-pointer block space-y-2">
                <FileText className="w-8 h-8 text-brand-600 mx-auto" />
                <div className="text-xs sm:text-sm font-semibold text-slate-700">
                  {policyFile ? policyFile.name : 'Choose digital policy PDF'}
                </div>
                <div className="text-[11px] text-slate-500">40–80 page digital PDF issued by insurer</div>
              </label>
            </div>
          </div>
        </div>

        {/* Error message box */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Privacy and Consent Statement (SEC-07) */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
          <span className="font-semibold text-slate-700">Privacy Notice:</span> Documents live only for this single session and are discarded at the end of the analysis. No personal data is retained or used for model training.
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-sm sm:text-base transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              Analyzing Documents & IRDAI Provisions...
            </span>
          ) : (
            <>
              <span>Extract & Verify Claim Facts</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
