import React, { useState } from 'react';
import { Download, Trash2, ArrowLeft } from 'lucide-react';
import { api, StructuredClaimRecord, Verdict } from '../api/client';
import { LanguageToggle } from '../components/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

interface AppealPageProps {
  analysisId: string;
  documentId: string;
  claimRecord: StructuredClaimRecord;
  verdict: Verdict;
  appealKind: string;
  onBackToVerdict: () => void;
  onSessionDisposed: () => void;
  language?: string;
  onLanguageChange: (lang: string) => void;
}

export const AppealPage: React.FC<AppealPageProps> = ({
  analysisId,
  documentId,
  claimRecord,
  verdict,
  appealKind,
  onBackToVerdict,
  onSessionDisposed,
  onLanguageChange,
}) => {
  const { language, t, translateDynamic } = useLanguage();
  const isFlowC = appealKind === 'grounds_request';
  const downloadUrl = api.getAppealDownloadUrl(analysisId, documentId);

  const handleDisposal = async () => {
    if (confirm(t('appeal.confirm_disposal'))) {
      await api.disposeSession(analysisId);
      onSessionDisposed();
    }
  };

  const claimRef = claimRecord.claim_reference || t('appeal.not_applicable');
  const policyholder = claimRecord.policyholder_name || t('appeal.insured_claimant');
  const policyNo = claimRecord.policy_number || t('appeal.refer_enclosed');
  const disputedAmount = claimRecord.claim_amount
    ? `₹${claimRecord.claim_amount.toLocaleString('en-IN')}`
    : t('appeal.as_per_bills');

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToVerdict}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t('appeal.back_btn')}
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isFlowC ? t('appeal.title_flow_c') : t('appeal.title_gro')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('appeal.subtitle', { insurer: claimRecord.insurer_name })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle currentLang={language} onToggle={onLanguageChange} />
        </div>
      </div>

      {/* Main Document Preview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 font-mono text-xs sm:text-sm leading-relaxed text-slate-800">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-4 text-center space-y-1">
          <div className="font-bold text-base text-slate-900">
            {isFlowC ? t('appeal.doc_header_flow_c') : t('appeal.doc_header_gro')}
          </div>
          <div className="text-xs text-slate-400 font-sans">
            {t('appeal.doc_sub')}
          </div>
        </div>

        {/* Addressee */}
        <div className="space-y-1">
          <p><b>{t('appeal.to')}</b></p>
          <p>{t('appeal.gro_designation')}</p>
          <p className="font-bold text-slate-900">{claimRecord.insurer_name}</p>
        </div>

        {/* Subject */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-sans font-semibold text-xs sm:text-sm text-slate-900">
          <b>{t('appeal.subject_label')}</b>{' '}
          {isFlowC
            ? t('appeal.subject_flow_c', { ref: claimRef })
            : t('appeal.subject_gro', { ref: claimRef })}
        </div>

        {/* Particulars */}
        <div className="space-y-1 font-sans text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('appeal.claim_particulars_title')}
          </div>
          <p>• <b>{t('appeal.particular_name')}</b> {policyholder}</p>
          <p>• <b>{t('appeal.particular_policy_no')}</b> {policyNo}</p>
          <p>• <b>{t('appeal.particular_claim_ref')}</b> {claimRef}</p>
          <p>• <b>{t('appeal.particular_date')}</b> {claimRecord.rejection_date}</p>
          <p>• <b>{t('appeal.particular_amount')}</b> {disputedAmount}</p>
          <p>• <b>{t('appeal.particular_ground')}</b> {translateDynamic(claimRecord.stated_ground)}</p>
        </div>

        {/* Grounds */}
        <div className="space-y-2">
          <div className="font-bold text-slate-900 font-sans text-xs uppercase tracking-wider">
            {t('appeal.statutory_grounds_title')}
          </div>
          <ul className="space-y-1.5 pl-4 list-disc">
            {verdict.reasons.map((r, i) => (
              <li key={i}>{translateDynamic(r)}</li>
            ))}
          </ul>
        </div>

        {/* Evidence items */}
        <div className="space-y-2">
          <div className="font-bold text-slate-900 font-sans text-xs uppercase tracking-wider">
            {t('appeal.evidence_citations_title')}
          </div>
          <div className="space-y-1.5 text-xs text-slate-700">
            {verdict.evidence_trail.map((ev, i) => {
              const sourceLabel = ev.provision_ref
                ? translateDynamic(ev.provision_ref)
                : (language === 'hi'
                    ? `पॉलिसी दस्तावेज़ पृष्ठ ${ev.page_number}`
                    : `Policy Wording Page ${ev.page_number}`);
              return (
                <p key={i}>
                  <b>[{i + 1}]</b> {translateDynamic(ev.statement)} (<i>{t('appeal.source_label')} {sourceLabel}</i>)
                </p>
              );
            })}
          </div>
        </div>

        {/* Demand & Timeline */}
        <div className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-200">
          <p>
            <b>{t('appeal.demand_label')}</b> {t('appeal.demand_text_1')}
          </p>
          <p>{t('appeal.demand_text_2')}</p>
        </div>

        {/* Signoff */}
        <div className="pt-4 font-sans text-xs">
          <p>{t('appeal.signoff_yours')}</p>
          <p className="font-bold text-slate-900 mt-4">{policyholder}</p>
          {claimRecord.policyholder_name && (
            <p className="text-slate-600 text-xs">{t('appeal.signoff_role')}</p>
          )}
          <p className="text-slate-500">{t('appeal.signoff_date', { date: claimRecord.rejection_date })}</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Download Button */}
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{t('appeal.btn_download')}</span>
        </a>

        {/* Privacy Disposal Button (FR-13) */}
        <button
          type="button"
          onClick={handleDisposal}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>{t('appeal.btn_dispose')}</span>
        </button>
      </div>
    </div>
  );
};
