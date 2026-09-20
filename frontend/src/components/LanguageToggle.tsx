import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

interface LanguageToggleProps {
  currentLang?: string;
  onToggle?: (lang: string) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ currentLang, onToggle }) => {
  const context = useLanguage();
  const activeLang = (currentLang || context.language) as Language;

  const handleToggle = (lang: Language) => {
    if (onToggle) {
      onToggle(lang);
    }
    context.setLanguage(lang);
  };

  return (
    <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200" role="group" aria-label="Language selector">
      <div className="px-2 py-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Languages className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{context.t('nav.language_label')}</span>
      </div>
      <button
        type="button"
        onClick={() => handleToggle('en')}
        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
          activeLang === 'en'
            ? 'bg-white text-brand-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-pressed={activeLang === 'en'}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleToggle('hi')}
        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
          activeLang === 'hi'
            ? 'bg-white text-brand-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-pressed={activeLang === 'hi'}
      >
        हिन्दी (Hindi)
      </button>
    </div>
  );
};
