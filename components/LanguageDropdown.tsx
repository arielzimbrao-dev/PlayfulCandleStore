'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES } from '@/lib/i18n';
import { useLang } from './LanguageProvider';

export default function LanguageDropdown() {
  const { locale, setLocale, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="langdd" ref={ref}>
      <button
        type="button"
        className="hd-icon langdd__toggle"
        aria-label={t.header.language}
        title={t.header.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`fi fi-${current.country}`} aria-hidden="true" />
        <i className="fa-solid fa-chevron-down langdd__caret" aria-hidden="true" />
      </button>
      <ul className="langdd__menu" role="listbox" aria-label={t.lang.label} hidden={!open}>
        {LOCALES.map((l) => (
          <li key={l.code}>
            <button
              type="button"
              role="option"
              aria-selected={l.code === locale}
              className={`langdd__opt${l.code === locale ? ' is-active' : ''}`}
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
            >
              <span className={`fi fi-${l.country}`} aria-hidden="true" /> {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
