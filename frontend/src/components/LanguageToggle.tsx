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
    <div
      className="inline-flex items-center rounded-lg bg-zinc-100/90 p-0.5 border border-zinc-200/80 text-xs shadow-2xs"
      role="group"
      aria-label="Language selector"
    >
      <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 select-none">
        <Languages className="w-3.5 h-3.5 text-zinc-400" />
        <span className="hidden sm:inline">{context.t('nav.language_label')}</span>
      </div>
      <button
        type="button"
        onClick={() => handleToggle('en')}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
          activeLang === 'en'
            ? 'bg-white text-zinc-950 font-semibold shadow-2xs border border-zinc-200/50'
            : 'text-zinc-600 hover:text-zinc-950'
        }`}
        aria-pressed={activeLang === 'en'}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleToggle('hi')}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
          activeLang === 'hi'
            ? 'bg-white text-zinc-950 font-semibold shadow-2xs border border-zinc-200/50'
            : 'text-zinc-600 hover:text-zinc-950'
        }`}
        aria-pressed={activeLang === 'hi'}
      >
        हिन्दी (Hindi)
      </button>
    </div>
  );
};
