'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isQuestionLanguage, type QuestionLanguage } from '@/lib/question-localization';

export type { QuestionLanguage } from '@/lib/question-localization';

export interface QuestionLanguageContextValue {
  language: QuestionLanguage;
  setLanguage: (language: QuestionLanguage) => void;
  toggleLanguage: () => void;
}

export const QUESTION_LANGUAGE_STORAGE_KEY = 'medadn-question-language';

const DEFAULT_LANGUAGE: QuestionLanguage = 'fr';

const QuestionLanguageContext = createContext<QuestionLanguageContextValue | null>(null);

function persist(language: QuestionLanguage) {
  try {
    localStorage.setItem(QUESTION_LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage unavailable (private mode, quota): the choice lasts for this page only
  }
}

/**
 * Language used to display questions (French by default). The choice is kept in localStorage and
 * follows changes made in other tabs.
 */
export function QuestionLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<QuestionLanguage>(DEFAULT_LANGUAGE);

  // Read the stored choice once on mount (localStorage is not available during SSR)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUESTION_LANGUAGE_STORAGE_KEY);
      if (isQuestionLanguage(stored)) setLanguageState(stored);
    } catch {
      // Keep the default
    }
  }, []);

  // Keep tabs in sync
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== QUESTION_LANGUAGE_STORAGE_KEY) return;
      setLanguageState(isQuestionLanguage(event.newValue) ? event.newValue : DEFAULT_LANGUAGE);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLanguage = useCallback((next: QuestionLanguage) => {
    if (!isQuestionLanguage(next)) return;
    setLanguageState(next);
    persist(next);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  }, [language, setLanguage]);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage }),
    [language, setLanguage, toggleLanguage],
  );

  return <QuestionLanguageContext.Provider value={value}>{children}</QuestionLanguageContext.Provider>;
}

const FALLBACK: QuestionLanguageContextValue = {
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  toggleLanguage: () => {},
};

/** Current question language; French (and no-op setters) outside a QuestionLanguageProvider. */
export function useQuestionLanguage(): QuestionLanguageContextValue {
  return useContext(QuestionLanguageContext) ?? FALLBACK;
}
