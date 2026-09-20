import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, t as translateKey, translateDynamic as translateDyn } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translateDynamic: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'pratikar_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') {
        return saved;
      }
    } catch {
      // localStorage may fail in restricted sandbox / private mode
    }
    return 'en';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore storage error
    }
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    return translateKey(key, language, params);
  };

  const translateDynamic = (text: string) => {
    return translateDyn(text, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateDynamic }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
