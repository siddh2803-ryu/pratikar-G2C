import React from 'react';
import { ArrowRight, FileSearch, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { StructuredClaimRecord, Verdict } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface ConfirmPageProps {
  claimRecord: StructuredClaimRecord;
  verdict: Verdict | null;
  onConfirm: () => void;
  onBack: () => void;
  language?: string;
}

export const ConfirmPage: React.FC<ConfirmPageProps> = ({
  claimRecord,
  onConfirm,
  onBack,
}) => {
  const { t, translateDynamic } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2 sm:py-4">
      {/* Step Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-xs font-medium tracking-tight shadow-2xs">
          <FileSearch className="w-3.5 h-3.5 text-zinc-500" />
          <span>{t('confirm.step_badge')}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
          {t('confirm.title')}
        </h2>
        <p className="text-zinc-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          {t('confirm.subtitle')}
        </p>
      </div>

      {/* Main Fact Confirmation Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Policyholder Name */}
          <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t('confirm.field_policyholder')}
            </span>
            <div className="text-sm font-semibold text-zinc-900 mt-1">
              {claimRecord.policyholder_name || (
                <span className="text-zinc-400 italic">{t('confirm.fallback_policyholder')}</span>
              )}
            </div>
          </div>

          {/* Insurer Name */}
          <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t('confirm.field_insurer')}
            </span>
            <div className="text-sm font-semibold text-zinc-900 mt-1">
              {claimRecord.insurer_name}
            </div>
          </div>

          {/* Policy Number */}
          <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t('confirm.field_policy_number')}
            </span>
            <div className="text-sm font-medium text-zinc-800 mt-1 font-mono">
              {claimRecord.policy_number || (
                <span className="text-zinc-400 italic font-sans">{t('confirm.fallback_not_stated')}</span>
              )}
            </div>
          </div>

          {/* Claim Reference */}
          <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t('confirm.field_claim_ref')}
            </span>
            <div className="text-sm font-medium text-zinc-800 mt-1 font-mono">
              {claimRecord.claim_reference || (
                <span className="text-zinc-400 italic font-sans">{t('confirm.fallback_not_stated')}</span>
              )}
            </div>
          </div>

          {/* Disputed Amount */}
          <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t('confirm.field_disputed_amount')}
            </span>
            <div className="text-sm font-bold text-zinc-950 mt-1">
              {claimRecord.claim_amount ? (
                `₹${claimRecord.claim_amount.toLocaleString('en-IN')}`
              ) : (
                <span className="text-zinc-400 italic">{t('confirm.fallback_as_per_bills')}</span>
              )}
            </div>
          </div>

          {/* Rejection Date */}
          <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t('confirm.field_rejection_date')}
            </span>
            <div className="text-sm font-medium text-zinc-800 mt-1 font-mono">
              {claimRecord.rejection_date}
            </div>
          </div>

          {/* Continuous Months / Tenure */}
          <div className="sm:col-span-2 p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t('confirm.field_tenure')}
            </span>
            <div className="text-sm font-semibold text-zinc-950 mt-1 flex items-center gap-2">
              {claimRecord.continuous_months !== null ? (
                <span>
                  {claimRecord.continuous_months} {t('confirm.months')}{' '}
                  {claimRecord.continuous_months >= 60 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md ml-1 border border-emerald-200/60">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {t('confirm.moratorium_met')}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-zinc-400 italic">{t('confirm.fallback_tenure_unknown')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Cited Clause (Crucial - drives Flow C if missing) */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            claimRecord.cited_clause_ref
              ? 'bg-zinc-50/90 border-zinc-200/90'
              : 'bg-amber-50/70 border-amber-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              {t('confirm.clause_box_title')}
            </span>
            {claimRecord.cited_clause_ref ? (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-900 text-white font-mono shadow-2xs">
                {claimRecord.cited_clause_ref}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 border border-amber-200 px-2.5 py-0.5 rounded-md">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                {t('confirm.clause_absent_badge')}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
            {claimRecord.cited_clause_ref
              ? t('confirm.clause_present_desc')
              : t('confirm.clause_absent_desc')}
          </p>
        </div>

        {/* Stated Ground */}
        <div className="p-4 rounded-xl bg-zinc-50/90 border border-zinc-200/90">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
            {t('confirm.stated_ground_title')}
          </span>
          <p className="text-sm font-medium text-zinc-900 leading-relaxed bg-white p-3 rounded-lg border border-zinc-200/70 font-mono text-xs">
            {translateDynamic(claimRecord.stated_ground)}
          </p>
        </div>

        {/* Buttons (Vercel Style Actions) */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 text-zinc-700 font-medium text-sm transition-all shadow-2xs flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500" />
            <span>{t('confirm.btn_back')}</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-black active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <span>{t('confirm.btn_proceed')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPage;
