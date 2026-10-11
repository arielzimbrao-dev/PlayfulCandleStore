'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, dictionaries, type Dict, type Locale } from '@/lib/i18n';

type LanguageContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: Dict };
const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = 'pc-locale';

function isLocale(value: unknown): value is Locale {
  return value === 'pt' || value === 'es' || value === 'en';
}

// Idioma da loja (PT/ES/EN). Uso nos componentes: const t = useT(); t.cart.title
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Aplica o idioma guardado só depois de montar: o servidor sempre renderiza o padrão,
  // então não há diferença de hidratação.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* modo privado / armazenamento bloqueado */
    }
    if (isLocale(stored)) {
      setLocaleState(stored);
      document.documentElement.lang = dictionaries[stored].langHtml;
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      /* armazenamento bloqueado: o idioma vale só nesta visita */
    }
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;samesite=lax`; // 1 ano
    document.documentElement.lang = dictionaries[newLocale].langHtml;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLang precisa estar dentro de <LanguageProvider>');
  return context;
}

export function useT(): Dict {
  return useLang().t;
}
