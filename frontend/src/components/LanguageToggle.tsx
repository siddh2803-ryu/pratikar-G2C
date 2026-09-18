import React from 'react';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  currentLang: string;
  onToggle: (lang: string) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ currentLang, onToggle }) => {
  return (
    <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
      <div className="px-2 py-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Languages className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Language:</span>
      </div>
      <button
        onClick={() => onToggle('en')}
        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
          currentLang === 'en'
            ? 'bg-white text-brand-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        English
      </button>
      <button
        onClick={() => onToggle('hi')}
        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
          currentLang === 'hi'
            ? 'bg-white text-brand-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        हिन्दी (Hindi)
      </button>
    </div>
  );
};
