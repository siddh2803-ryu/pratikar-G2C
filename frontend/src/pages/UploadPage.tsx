import React, { useState } from 'react';
import { UploadCloud, FileText, AlertCircle, Sparkles, ArrowRight, Shield } from 'lucide-react';
import { api, AnalysisResponse } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface UploadPageProps {
  onAnalysisStarted: (analysisData: AnalysisResponse) => void;
  language?: string;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onAnalysisStarted, language: propLang }) => {
  const { language, t } = useLanguage();
  const effectiveLang = propLang || language;

  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterFile || !policyFile) {
      setErrorMsg(t('upload.error_both_files'));
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const { analysis_id } = await api.startAnalysis(letterFile, policyFile, effectiveLang);
      const data = await api.getAnalysis(analysis_id);
      onAnalysisStarted(data);
    } catch (err: any) {
      setErrorMsg(err.message || t('upload.error_analysis_failed'));
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
      setErrorMsg(err.message || t('upload.error_demo_failed'));
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
          <span>{t('upload.hero_badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t('upload.hero_title')}
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          {t('upload.hero_desc')}
        </p>
      </div>

      {/* Pre-cached Demo Cases Selector (<5s demo guarantee) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {t('upload.fast_path_title')}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">{t('upload.fast_path_time')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-1-strong-moratorium')}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-left transition-all group"
          >
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
              {t('upload.demo1_tag')}
            </div>
            <div className="text-xs font-semibold mt-1 text-slate-100 group-hover:text-white">
              {t('upload.demo1_title')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t('upload.demo1_desc')}
            </div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-2-weak-valid-rejection')}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-left transition-all group"
          >
            <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wide">
              {t('upload.demo_weak_tag')}
            </div>
            <div className="text-xs font-semibold mt-1 text-slate-100 group-hover:text-white">
              {t('upload.demo_weak_title')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t('upload.demo_weak_desc')}
            </div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-2-no-clause')}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-left transition-all group"
          >
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
              {t('upload.demo2_tag')}
            </div>
            <div className="text-xs font-semibold mt-1 text-slate-100 group-hover:text-white">
              {t('upload.demo2_title')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t('upload.demo2_desc')}
            </div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-3-clause-mismatch')}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 rounded-xl text-left transition-all group"
          >
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
              {t('upload.demo3_tag')}
            </div>
            <div className="text-xs font-semibold mt-1 text-slate-100 group-hover:text-white">
              {t('upload.demo3_title')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t('upload.demo3_desc')}
            </div>
          </button>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleFileUpload} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File 1: Rejection Letter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('upload.label_letter')} <span className="text-rose-500">*</span>
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
                  {letterFile ? letterFile.name : t('upload.choose_file_letter')}
                </div>
                <div className="text-[11px] text-slate-500">{t('upload.hint_letter')}</div>
              </label>
            </div>
          </div>

          {/* File 2: Policy Wording */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('upload.label_policy')} <span className="text-rose-500">*</span>
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
                  {policyFile ? policyFile.name : t('upload.choose_file_policy')}
                </div>
                <div className="text-[11px] text-slate-500">{t('upload.hint_policy')}</div>
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
          <span className="font-semibold text-slate-700">{t('upload.privacy_notice_title')}</span>{' '}
          {t('upload.privacy_notice_desc')}
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
              {t('upload.btn_analyzing')}
            </span>
          ) : (
            <>
              <span>{t('upload.btn_submit')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
