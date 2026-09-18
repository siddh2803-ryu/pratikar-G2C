import React, { useState } from 'react';
import { Download, Check, Trash2, ArrowLeft, Languages, FileCheck, ShieldAlert } from 'lucide-react';
import { api, StructuredClaimRecord, Verdict } from '../api/client';
import { LanguageToggle } from '../components/LanguageToggle';

interface AppealPageProps {
  analysisId: string;
  documentId: string;
  claimRecord: StructuredClaimRecord;
  verdict: Verdict;
  appealKind: string;
  onBackToVerdict: () => void;
  onSessionDisposed: () => void;
  language: string;
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
  language,
  onLanguageChange,
}) => {
  const [downloading, setDownloading] = useState(false);
  const isFlowC = appealKind === 'grounds_request';

  const downloadUrl = api.getAppealDownloadUrl(analysisId, documentId);

  const handleDisposal = async () => {
    if (confirm('This will permanently delete your uploaded documents and session records from Pratikar storage (PRD FR-13). Continue?')) {
      await api.disposeSession(analysisId);
      onSessionDisposed();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToVerdict}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Verdict & Evidence
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isFlowC ? 'Request for Rejection Grounds Letter' : 'Grievance-Officer (GRO) Appeal Letter'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ready to download and submit directly to {claimRecord.insurer_name}.
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
            {isFlowC
              ? 'REQUEST FOR SPECIFIC GROUNDS AND CLAUSE OF CLAIM REPUDIATION'
              : 'FORMAL GRIEVANCE APPEAL UNDER IRDAI PROTECTION REGULATIONS'}
          </div>
          <div className="text-xs text-slate-400 font-sans">
            Prepared via Pratikar InsurTech Contest Engine · Filed Directly by Policyholder
          </div>
        </div>

        {/* Addressee */}
        <div className="space-y-1">
          <p><b>To,</b></p>
          <p>The Grievance Redressal Officer (GRO) / Claims Department</p>
          <p className="font-bold text-slate-900">{claimRecord.insurer_name}</p>
        </div>

        {/* Subject */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-sans font-semibold text-xs sm:text-sm text-slate-900">
          <b>Subject:</b>{' '}
          {isFlowC
            ? `Demand for Specific Contractual Clause and Ground for Claim Repudiation Ref: ${claimRecord.claim_reference || 'N/A'}`
            : `Contest and Demand for Reconsideration of Repudiated Claim Ref: ${claimRecord.claim_reference || 'N/A'}`}
        </div>

        {/* Particulars */}
        <div className="space-y-1 font-sans text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="font-bold uppercase tracking-wider text-slate-500 mb-2">Claim Particulars</div>
          <p>• <b>Policy Number:</b> {claimRecord.policy_number || 'Refer enclosed policy'}</p>
          <p>• <b>Claim Reference ID:</b> {claimRecord.claim_reference || 'N/A'}</p>
          <p>• <b>Date of Repudiation:</b> {claimRecord.rejection_date}</p>
          <p>• <b>Disputed Amount:</b> {claimRecord.claim_amount ? `₹${claimRecord.claim_amount.toLocaleString('en-IN')}` : 'As per hospital bills'}</p>
          <p>• <b>Stated Insurer Ground:</b> {claimRecord.stated_ground}</p>
        </div>

        {/* Grounds */}
        <div className="space-y-2">
          <div className="font-bold text-slate-900 font-sans text-xs uppercase tracking-wider">
            {language === 'hi' ? 'अपील के वैधानिक एवं अनुबंधीय आधार' : 'Statutory & Contractual Grounds:'}
          </div>
          <ul className="space-y-1.5 pl-4 list-disc">
            {verdict.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>

        {/* Evidence items */}
        <div className="space-y-2">
          <div className="font-bold text-slate-900 font-sans text-xs uppercase tracking-wider">
            {language === 'hi' ? 'साक्ष्य एवं उद्धरण' : 'Evidence & Document Citations:'}
          </div>
          <div className="space-y-1.5 text-xs text-slate-700">
            {verdict.evidence_trail.map((ev, i) => (
              <p key={i}>
                <b>[{i + 1}]</b> {ev.statement} (<i>Source: {ev.provision_ref || `Policy Wording Page ${ev.page_number}`}</i>)
              </p>
            ))}
          </div>
        </div>

        {/* Demand & Timeline */}
        <div className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-200">
          <p>
            <b>Demand for Redressal:</b> Under IRDAI regulations, the insurer must dispose of this grievance in writing within 15 calendar days.
          </p>
          <p>
            In the event this grievance is not resolved to satisfaction, this matter will be escalated to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 without further notice.
          </p>
        </div>

        {/* Signoff */}
        <div className="pt-4 font-sans text-xs">
          <p>Yours faithfully,</p>
          <p className="font-bold text-slate-900 mt-4">Policyholder / Insured Claimant</p>
          <p className="text-slate-500">Date: {claimRecord.rejection_date}</p>
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
          <span>Download Ready-to-File PDF</span>
        </a>

        {/* Privacy Disposal Button (FR-13) */}
        <button
          onClick={handleDisposal}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>Dispose Session & Delete Documents</span>
        </button>
      </div>
    </div>
  );
};
