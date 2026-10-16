import React from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Verdict, StructuredClaimRecord } from '../api/client';
import { VerdictCard } from '../components/VerdictCard';
import { EvidenceTrail } from '../components/EvidenceTrail';
import { NonAdviceNotice } from '../components/NonAdviceNotice';
import { useLanguage } from '../context/LanguageContext';

interface VerdictPageProps {
  verdict: Verdict;
  claimRecord: StructuredClaimRecord;
  onGenerateAppeal: () => void;
  onRestart: () => void;
  language?: string;
  isGeneratingAppeal: boolean;
}

export const VerdictPage: React.FC<VerdictPageProps> = ({
  verdict,
  onGenerateAppeal,
  onRestart,
  isGeneratingAppeal,
}) => {
  const { t } = useLanguage();
  const isWeak = verdict.level === 'weak';
  const isFlowC = verdict.flow === 'flow_c';

  return (
    <div className="max-w-4xl mx-auto space-y-7 py-2 sm:py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200/80 text-[10px] font-bold uppercase tracking-wider text-zinc-600 shadow-2xs">
            {t('verdict.step_badge')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 mt-1 tracking-tight">
            {t('verdict.title')}
          </h1>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 text-xs font-medium text-zinc-700 transition-all shadow-2xs w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-400" /> {t('verdict.btn_restart')}
        </button>
      </div>

      {/* 1. Verdict Card */}
      <VerdictCard verdict={verdict} />

      {/* 2. Verifiable Evidence Trail (Visual Centerpiece) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            {t('verdict.trail_title')}
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            {t('verdict.sources_count', { count: verdict.evidence_trail.length })}
          </span>
        </div>
        <EvidenceTrail evidenceTrail={verdict.evidence_trail} />
      </div>

      {/* 3. Statutory Deadline & Non-Advice Notices (FR-14) */}
      <NonAdviceNotice />

      {/* 4. Action Banner */}
      <div className="p-6 sm:p-7 bg-white rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            {t('verdict.next_action_label')}
          </div>
          <div className="text-base sm:text-lg font-bold text-zinc-950 mt-0.5 tracking-tight">
            {isWeak ? (
              <span>{t('verdict.next_action_weak')}</span>
            ) : isFlowC ? (
              <span>{t('verdict.next_action_flow_c')}</span>
            ) : (
              <span>{t('verdict.next_action_strong')}</span>
            )}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            {isWeak
              ? t('verdict.next_action_weak_sub')
              : t('verdict.next_action_strong_sub')}
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto shrink-0">
          {!isWeak && (
            <button
              type="button"
              onClick={onGenerateAppeal}
              disabled={isGeneratingAppeal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-950 hover:bg-black active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isGeneratingAppeal ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  {t('verdict.btn_drafting')}
                </span>
              ) : (
                <>
                  <span>
                    {isFlowC ? t('verdict.btn_draft_flow_c') : t('verdict.btn_draft_strong')}
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

export default VerdictPage;
