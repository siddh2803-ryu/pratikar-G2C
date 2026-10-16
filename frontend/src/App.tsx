import React, { useState, useEffect } from 'react';
import { Shield, Check } from 'lucide-react';
import { api, AnalysisResponse, StructuredClaimRecord, Verdict } from './api/client';
import { UploadPage } from './pages/UploadPage';
import { ConfirmPage } from './pages/ConfirmPage';
import { VerdictPage } from './pages/VerdictPage';
import { AppealPage } from './pages/AppealPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { LanguageToggle } from './components/LanguageToggle';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Language } from './i18n/translations';

type AppStep = 'upload' | 'confirm' | 'verdict' | 'appeal' | 'privacy' | 'terms';

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [step, setStep] = useState<AppStep>('upload');
  const [previousStep, setPreviousStep] = useState<AppStep>('upload');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [claimRecord, setClaimRecord] = useState<StructuredClaimRecord | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [appealDocumentId, setAppealDocumentId] = useState<string | null>(null);
  const [appealKind, setAppealKind] = useState<string>('gro_letter');
  const [isGeneratingAppeal, setIsGeneratingAppeal] = useState<boolean>(false);
  const [apiWarmed, setApiWarmed] = useState<boolean>(false);

  // Synchronize hash routing for direct access to #privacy and #terms
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#privacy') {
        setStep('privacy');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === '#terms') {
        setStep('terms');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Ping /api/health on mount to warm API for evaluation
  useEffect(() => {
    api.getHealth()
      .then((res) => {
        if (res.status === 'healthy') setApiWarmed(true);
      })
      .catch(() => setApiWarmed(false));
  }, []);

  const handleAnalysisStarted = (data: AnalysisResponse) => {
    setAnalysisId(data.analysis_id);
    setClaimRecord(data.claim_record);
    setVerdict(data.verdict);
    // If demo case or direct upload, go to confirm screen
    if (data.claim_record) {
      setStep('confirm');
    } else if (data.verdict) {
      setStep('verdict');
    }
  };

  const handleConfirmFacts = () => {
    setStep('verdict');
  };

  const handleGenerateAppeal = async () => {
    if (!analysisId) return;
    setIsGeneratingAppeal(true);
    try {
      const res = await api.generateAppeal(analysisId, language);
      setAppealDocumentId(res.document_id);
      setAppealKind(res.kind);
      setStep('appeal');
    } catch (err: any) {
      alert(err.message || 'Failed to generate appeal.');
    } finally {
      setIsGeneratingAppeal(false);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang as Language);
    if (step === 'appeal' && analysisId) {
      // Regenerate document in new language
      try {
        const res = await api.generateAppeal(analysisId, newLang);
        setAppealDocumentId(res.document_id);
      } catch (e) {
        console.error('Language switch appeal generation error:', e);
      }
    }
  };

  const handleRestart = () => {
    setStep('upload');
    setAnalysisId(null);
    setClaimRecord(null);
    setVerdict(null);
    setAppealDocumentId(null);
  };

  // Helper to determine step ordering
  const stepIndex = {
    upload: 1,
    confirm: 2,
    verdict: 3,
    appeal: 4,
    privacy: 0,
    terms: 0,
  }[step];

  const navigateToLegal = (legalStep: 'privacy' | 'terms') => {
    if (step !== 'privacy' && step !== 'terms') {
      setPreviousStep(step);
    }
    setStep(legalStep);
    window.location.hash = legalStep;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBackFromLegal = () => {
    setStep(previousStep);
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900 selection:bg-zinc-200">
      {/* Vercel-Style Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={handleRestart}
            title="Reset to Home"
          >
            <div className="p-2 rounded-xl bg-zinc-950 text-white shadow-xs border border-zinc-800 transition-transform duration-150 group-hover:scale-105">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-zinc-950">
                  {t('nav.brand')}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-700">
                  {t('nav.insurtech')}
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 hidden sm:block tracking-tight">
                {t('nav.tagline')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Warmed API status badge with Vercel ping dot */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium px-2.5 py-1 rounded-md bg-zinc-100/90 text-zinc-600 border border-zinc-200/80 shadow-2xs">
              <span className="relative flex h-2 w-2">
                {apiWarmed && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    apiWarmed ? 'bg-emerald-500' : 'bg-zinc-400'
                  }`}
                ></span>
              </span>
              <span>{apiWarmed ? t('nav.api_warmed') : t('nav.api_connecting')}</span>
            </div>

            <LanguageToggle currentLang={language} onToggle={handleLanguageChange} />
          </div>
        </div>

        {/* Vercel-Style Segmented Step Progress Indicator */}
        <nav className="bg-zinc-50/70 border-t border-zinc-200/60 py-2 px-4" aria-label="Progress">
          <div className="max-w-4xl mx-auto flex items-center justify-center">
            <ol className="flex items-center gap-1.5 sm:gap-3 text-xs font-medium">
              {/* Step 1 */}
              <li
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  step === 'upload'
                    ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                    : stepIndex > 1
                    ? 'text-zinc-700 hover:text-zinc-950 cursor-pointer'
                    : 'text-zinc-400'
                }`}
                onClick={() => {
                  if (stepIndex > 1 || step === 'privacy' || step === 'terms') handleRestart();
                }}
              >
                <span
                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold ${
                    step === 'upload'
                      ? 'bg-white text-zinc-950'
                      : stepIndex > 1
                      ? 'bg-zinc-200 text-zinc-800'
                      : 'bg-zinc-200/80 text-zinc-400'
                  }`}
                >
                  {stepIndex > 1 ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '1'}
                </span>
                <span className="hidden xs:inline">{t('nav.step_1')}</span>
              </li>

              <li className="text-zinc-300 text-xs">/</li>

              {/* Step 2 */}
              <li
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  step === 'confirm'
                    ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                    : stepIndex > 2
                    ? 'text-zinc-700 hover:text-zinc-950 cursor-pointer'
                    : 'text-zinc-400'
                }`}
                onClick={() => {
                  if (stepIndex > 2 && claimRecord) setStep('confirm');
                }}
              >
                <span
                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold ${
                    step === 'confirm'
                      ? 'bg-white text-zinc-950'
                      : stepIndex > 2
                      ? 'bg-zinc-200 text-zinc-800'
                      : 'bg-zinc-200/80 text-zinc-400'
                  }`}
                >
                  {stepIndex > 2 ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '2'}
                </span>
                <span className="hidden xs:inline">{t('nav.step_2')}</span>
              </li>

              <li className="text-zinc-300 text-xs">/</li>

              {/* Step 3 */}
              <li
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  step === 'verdict'
                    ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                    : stepIndex > 3
                    ? 'text-zinc-700 hover:text-zinc-950 cursor-pointer'
                    : 'text-zinc-400'
                }`}
                onClick={() => {
                  if (stepIndex > 3 && verdict) setStep('verdict');
                }}
              >
                <span
                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold ${
                    step === 'verdict'
                      ? 'bg-white text-zinc-950'
                      : stepIndex > 3
                      ? 'bg-zinc-200 text-zinc-800'
                      : 'bg-zinc-200/80 text-zinc-400'
                  }`}
                >
                  {stepIndex > 3 ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '3'}
                </span>
                <span className="hidden xs:inline">{t('nav.step_3')}</span>
              </li>

              <li className="text-zinc-300 text-xs">/</li>

              {/* Step 4 */}
              <li
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  step === 'appeal'
                    ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                    : 'text-zinc-400'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold ${
                    step === 'appeal'
                      ? 'bg-white text-zinc-950'
                      : 'bg-zinc-200/80 text-zinc-400'
                  }`}
                >
                  4
                </span>
                <span className="hidden xs:inline">{t('nav.step_4')}</span>
              </li>
            </ol>
          </div>
        </nav>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {step === 'upload' && (
          <UploadPage onAnalysisStarted={handleAnalysisStarted} language={language} />
        )}

        {step === 'confirm' && claimRecord && (
          <ConfirmPage
            claimRecord={claimRecord}
            verdict={verdict}
            onConfirm={handleConfirmFacts}
            onBack={handleRestart}
            language={language}
          />
        )}

        {step === 'verdict' && verdict && claimRecord && (
          <VerdictPage
            verdict={verdict}
            claimRecord={claimRecord}
            onGenerateAppeal={handleGenerateAppeal}
            onRestart={handleRestart}
            language={language}
            isGeneratingAppeal={isGeneratingAppeal}
          />
        )}

        {step === 'appeal' && analysisId && appealDocumentId && claimRecord && verdict && (
          <AppealPage
            analysisId={analysisId}
            documentId={appealDocumentId}
            claimRecord={claimRecord}
            verdict={verdict}
            appealKind={appealKind}
            onBackToVerdict={() => setStep('verdict')}
            onSessionDisposed={handleRestart}
            language={language}
            onLanguageChange={handleLanguageChange}
          />
        )}

        {step === 'privacy' && (
          <PrivacyPage onBack={handleBackFromLegal} />
        )}

        {step === 'terms' && (
          <TermsPage onBack={handleBackFromLegal} />
        )}
      </main>

      {/* Vercel-Style Minimalist Footer */}
      <footer className="mt-auto border-t border-zinc-200/80 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-950">{t('nav.brand')}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-600">{t('footer.disclaimer')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
            <button
              type="button"
              onClick={() => navigateToLegal('privacy')}
              className="hover:text-zinc-950 transition-colors cursor-pointer font-medium"
            >
              {t('footer.privacy')}
            </button>
            <span className="text-zinc-300">·</span>
            <button
              type="button"
              onClick={() => navigateToLegal('terms')}
              className="hover:text-zinc-950 transition-colors cursor-pointer font-medium"
            >
              {t('footer.terms')}
            </button>
            <span className="text-zinc-300">·</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-600 font-mono text-[10px]">
              {t('footer.zero_retention')}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
