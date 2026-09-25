'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, dictionaries, type Dict, type Locale } from '@/lib/i18n';

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: Dict };
const LanguageContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'pc-locale';

function isLocale(v: unknown): v is Locale {
  return v === 'pt' || v === 'es' || v === 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Apply the stored choice after mount (server always renders the default → no hydration mismatch).
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* private mode / blocked storage */
    }
    if (isLocale(stored)) {
      setLocaleState(stored);
      document.documentElement.lang = dictionaries[stored].langHtml;
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = dictionaries[l].langHtml;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang precisa estar dentro de <LanguageProvider>');
  return ctx;
}

export function useT(): Dict {
  return useLang().t;
}
