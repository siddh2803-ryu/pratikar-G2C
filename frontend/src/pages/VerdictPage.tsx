import React, { useState } from 'react';
import { ShieldCheck, FileText, ArrowRight, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Verdict, StructuredClaimRecord } from '../api/client';
import { VerdictCard } from '../components/VerdictCard';
import { EvidenceTrail } from '../components/EvidenceTrail';
import { NonAdviceNotice } from '../components/NonAdviceNotice';

interface VerdictPageProps {
  verdict: Verdict;
  claimRecord: StructuredClaimRecord;
  onGenerateAppeal: () => void;
  onRestart: () => void;
  language: string;
  isGeneratingAppeal: boolean;
}

export const VerdictPage: React.FC<VerdictPageProps> = ({
  verdict,
  claimRecord,
  onGenerateAppeal,
  onRestart,
  language,
  isGeneratingAppeal,
}) => {
  const isWeak = verdict.level === 'weak';
  const isFlowC = verdict.flow === 'flow_c';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Step 3 of 4: Two-Path Evaluation Complete
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Contestability Verdict & Evidence
          </h1>
        </div>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Start New Analysis
        </button>
      </div>

      {/* 1. Verdict Card */}
      <VerdictCard verdict={verdict} language={language} />

      {/* 2. Verifiable Evidence Trail (Visual Centerpiece) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Citation-Grounded Evidence Trail
          </h3>
          <span className="text-xs text-slate-500">
            {verdict.evidence_trail.length} Verified Sources
          </span>
        </div>
        <EvidenceTrail evidenceTrail={verdict.evidence_trail} language={language} />
      </div>

      {/* 3. Statutory Deadline & Non-Advice Notices (FR-14) */}
      <NonAdviceNotice language={language} />

      {/* 4. Action Banner */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Next Action</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">
            {isWeak ? (
              <span>No appeal recommended. The repudiation is contractually valid.</span>
            ) : isFlowC ? (
              <span>Generate formal Request-for-Grounds letter to insurer.</span>
            ) : (
              <span>Generate ready-to-file Grievance-Officer appeal document.</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {isWeak
              ? 'Filing an appeal on a valid exclusion would waste time and cost without legal prospect.'
              : 'All statements are cited strictly from your policy wording and IRDAI circulars.'}
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full sm:w-auto">
          {!isWeak && (
            <button
              onClick={onGenerateAppeal}
              disabled={isGeneratingAppeal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isGeneratingAppeal ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Drafting Appeal Document...
                </span>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>
                    {isFlowC ? 'Draft Grounds Demand Letter' : 'Draft Official GRO Appeal Letter'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
