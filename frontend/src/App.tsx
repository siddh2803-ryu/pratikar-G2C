import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { api, AnalysisResponse, StructuredClaimRecord, Verdict } from './api/client';
import { UploadPage } from './pages/UploadPage';
import { ConfirmPage } from './pages/ConfirmPage';
import { VerdictPage } from './pages/VerdictPage';
import { AppealPage } from './pages/AppealPage';
import { LanguageToggle } from './components/LanguageToggle';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Language } from './i18n/translations';

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [step, setStep] = useState<'upload' | 'confirm' | 'verdict' | 'appeal'>('upload');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [claimRecord, setClaimRecord] = useState<StructuredClaimRecord | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [appealDocumentId, setAppealDocumentId] = useState<string | null>(null);
  const [appealKind, setAppealKind] = useState<string>('gro_letter');
  const [isGeneratingAppeal, setIsGeneratingAppeal] = useState<boolean>(false);
  const [apiWarmed, setApiWarmed] = useState<boolean>(false);

  // Ping /api/health on mount to warm API for demo day
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleRestart}>
            <div className="p-2 rounded-xl bg-brand-600 text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  {t('nav.brand')}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700">
                  {t('nav.insurtech')}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 hidden sm:block">
                {t('nav.tagline')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Warmed API status badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${apiWarmed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{apiWarmed ? t('nav.api_warmed') : t('nav.api_connecting')}</span>
            </div>

            <LanguageToggle currentLang={language} onToggle={handleLanguageChange} />
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-100/70 border-t border-slate-200 py-1.5 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <div className="flex items-center gap-2 sm:gap-6 mx-auto">
              <span className={`flex items-center gap-1 ${step === 'upload' ? 'text-brand-600 font-bold' : ''}`}>
                <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">1</span>
                <span>{t('nav.step_1')}</span>
              </span>
              <span>→</span>
              <span className={`flex items-center gap-1 ${step === 'confirm' ? 'text-brand-600 font-bold' : ''}`}>
                <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">2</span>
                <span>{t('nav.step_2')}</span>
              </span>
              <span>→</span>
              <span className={`flex items-center gap-1 ${step === 'verdict' ? 'text-brand-600 font-bold' : ''}`}>
                <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">3</span>
                <span>{t('nav.step_3')}</span>
              </span>
              <span>→</span>
              <span className={`flex items-center gap-1 ${step === 'appeal' ? 'text-brand-600 font-bold' : ''}`}>
                <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">4</span>
                <span>{t('nav.step_4')}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4">
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
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <b>{t('nav.brand')}</b> · {t('footer.disclaimer')}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>{t('footer.team')}</span>
            <span>·</span>
            <span>{t('footer.zero_retention')}</span>
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
