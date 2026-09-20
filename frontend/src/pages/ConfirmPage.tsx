import React from 'react';
import { ArrowRight, FileSearch, AlertTriangle } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
          <FileSearch className="w-3.5 h-3.5" />
          <span>{t('confirm.step_badge')}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {t('confirm.title')}
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          {t('confirm.subtitle')}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Policyholder Name */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('confirm.field_policyholder')}
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {claimRecord.policyholder_name || (
                <span className="text-slate-400 italic">{t('confirm.fallback_policyholder')}</span>
              )}
            </div>
          </div>

          {/* Insurer Name */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('confirm.field_insurer')}
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {claimRecord.insurer_name}
            </div>
          </div>

          {/* Policy Number */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('confirm.field_policy_number')}
            </span>
            <div className="text-sm font-semibold text-slate-800 mt-1">
              {claimRecord.policy_number || (
                <span className="text-slate-400 italic">{t('confirm.fallback_not_stated')}</span>
              )}
            </div>
          </div>

          {/* Claim Reference */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('confirm.field_claim_ref')}
            </span>
            <div className="text-sm font-semibold text-slate-800 mt-1">
              {claimRecord.claim_reference || (
                <span className="text-slate-400 italic">{t('confirm.fallback_not_stated')}</span>
              )}
            </div>
          </div>

          {/* Disputed Amount */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('confirm.field_disputed_amount')}
            </span>
            <div className="text-sm font-bold text-brand-700 mt-1">
              {claimRecord.claim_amount ? (
                `₹${claimRecord.claim_amount.toLocaleString('en-IN')}`
              ) : (
                <span className="text-slate-400 italic">{t('confirm.fallback_as_per_bills')}</span>
              )}
            </div>
          </div>

          {/* Rejection Date */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('confirm.field_rejection_date')}
            </span>
            <div className="text-sm font-semibold text-slate-800 mt-1">
              {claimRecord.rejection_date}
            </div>
          </div>

          {/* Continuous Months / Tenure */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('confirm.field_tenure')}
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {claimRecord.continuous_months !== null ? (
                <span>
                  {claimRecord.continuous_months} {t('confirm.months')}{' '}
                  {claimRecord.continuous_months >= 60 && (
                    <span className="text-xs font-bold text-emerald-600">
                      {t('confirm.moratorium_met')}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-slate-400 italic">{t('confirm.fallback_tenure_unknown')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Cited Clause (Crucial - drives Flow C if missing) */}
        <div
          className={`p-4 rounded-xl border ${
            claimRecord.cited_clause_ref ? 'bg-sky-50/70 border-sky-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('confirm.clause_box_title')}
            </span>
            {claimRecord.cited_clause_ref ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white">
                {claimRecord.cited_clause_ref}
              </span>
            ) : (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {t('confirm.clause_absent_badge')}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {claimRecord.cited_clause_ref
              ? t('confirm.clause_present_desc')
              : t('confirm.clause_absent_desc')}
          </div>
        </div>

        {/* Stated Ground */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {t('confirm.stated_ground_title')}
          </span>
          <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
            "{translateDynamic(claimRecord.stated_ground)}"
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-all"
          >
            {t('confirm.btn_back')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <span>{t('confirm.btn_proceed')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
