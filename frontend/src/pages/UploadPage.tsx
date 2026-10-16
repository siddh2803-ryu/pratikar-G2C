import React, { useState } from 'react';
import { UploadCloud, FileText, AlertCircle, Sparkles, ArrowRight, Shield, CheckCircle2, X } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-8 py-2 sm:py-4">
      {/* Hero Heading */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-xs font-medium tracking-tight shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-zinc-600" />
          <span>{t('upload.hero_badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-950 tracking-tight">
          {t('upload.hero_title')}
        </h1>
        <p className="text-zinc-500 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          {t('upload.hero_desc')}
        </p>
      </div>

      {/* Pre-cached Demo Cases Selector (Vercel-Grade Dark Card) */}
      <div className="bg-zinc-950 text-white rounded-2xl border border-zinc-800/90 p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
        {/* Subtle radial glow */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-zinc-800/30 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              {t('upload.fast_path_title')}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">
            {t('upload.fast_path_time')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 relative z-10">
          {/* Demo 1 */}
          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-1-strong-moratorium')}
            disabled={loading}
            className="p-3.5 bg-zinc-900/90 hover:bg-zinc-800/90 active:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group duration-150 disabled:opacity-50"
          >
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {t('upload.demo1_tag')}
            </div>
            <div className="text-xs font-semibold mt-2 text-zinc-100 group-hover:text-white">
              {t('upload.demo1_title')}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 leading-snug">
              {t('upload.demo1_desc')}
            </div>
          </button>

          {/* Demo 2 */}
          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-2-weak-valid-rejection')}
            disabled={loading}
            className="p-3.5 bg-zinc-900/90 hover:bg-zinc-800/90 active:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group duration-150 disabled:opacity-50"
          >
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              {t('upload.demo_weak_tag')}
            </div>
            <div className="text-xs font-semibold mt-2 text-zinc-100 group-hover:text-white">
              {t('upload.demo_weak_title')}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 leading-snug">
              {t('upload.demo_weak_desc')}
            </div>
          </button>

          {/* Demo 3 */}
          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-2-no-clause')}
            disabled={loading}
            className="p-3.5 bg-zinc-900/90 hover:bg-zinc-800/90 active:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group duration-150 disabled:opacity-50"
          >
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {t('upload.demo2_tag')}
            </div>
            <div className="text-xs font-semibold mt-2 text-zinc-100 group-hover:text-white">
              {t('upload.demo2_title')}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 leading-snug">
              {t('upload.demo2_desc')}
            </div>
          </button>

          {/* Demo 4 */}
          <button
            type="button"
            onClick={() => loadDemoCase('demo-case-3-clause-mismatch')}
            disabled={loading}
            className="p-3.5 bg-zinc-900/90 hover:bg-zinc-800/90 active:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group duration-150 disabled:opacity-50"
          >
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {t('upload.demo3_tag')}
            </div>
            <div className="text-xs font-semibold mt-2 text-zinc-100 group-hover:text-white">
              {t('upload.demo3_title')}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 leading-snug">
              {t('upload.demo3_desc')}
            </div>
          </button>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleFileUpload} className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File 1: Rejection Letter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
              {t('upload.label_letter')} <span className="text-rose-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-zinc-50/60 hover:bg-zinc-50 group cursor-pointer ${
                letterFile
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <input
                type="file"
                id="rejectionLetter"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setLetterFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="rejectionLetter" className="cursor-pointer block space-y-2">
                {letterFile ? (
                  <div className="space-y-2 py-1">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-zinc-900 break-all px-2">
                      {letterFile.name}
                    </div>
                    <span className="inline-block text-[10px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {(letterFile.size / 1024 / 1024).toFixed(2)} MB · Ready
                    </span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-zinc-800 transition-colors mx-auto" />
                    <div className="text-xs sm:text-sm font-semibold text-zinc-800">
                      {t('upload.choose_file_letter')}
                    </div>
                    <div className="text-[11px] text-zinc-400">{t('upload.hint_letter')}</div>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* File 2: Policy Wording */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
              {t('upload.label_policy')} <span className="text-rose-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-zinc-50/60 hover:bg-zinc-50 group cursor-pointer ${
                policyFile
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <input
                type="file"
                id="policyWording"
                accept=".pdf"
                onChange={(e) => setPolicyFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="policyWording" className="cursor-pointer block space-y-2">
                {policyFile ? (
                  <div className="space-y-2 py-1">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-zinc-900 break-all px-2">
                      {policyFile.name}
                    </div>
                    <span className="inline-block text-[10px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {(policyFile.size / 1024 / 1024).toFixed(2)} MB · Ready
                    </span>
                  </div>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-zinc-400 group-hover:text-zinc-800 transition-colors mx-auto" />
                    <div className="text-xs sm:text-sm font-semibold text-zinc-800">
                      {t('upload.choose_file_policy')}
                    </div>
                    <div className="text-[11px] text-zinc-400">{t('upload.hint_policy')}</div>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Error message box */}
        {errorMsg && (
          <div className="p-4 bg-rose-50/90 border border-rose-200/90 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Privacy and Consent Statement (SEC-07) */}
        <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 text-zinc-500 text-[11px] leading-relaxed flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-800">{t('upload.privacy_notice_title')}</span>{' '}
            {t('upload.privacy_notice_desc')}
          </div>
        </div>

        {/* Submit button (Vercel High-Contrast Button) */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-zinc-950 hover:bg-black active:scale-[0.99] text-white font-semibold text-sm sm:text-base transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
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

export default UploadPage;
