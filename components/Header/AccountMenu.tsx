'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useT } from '../LanguageProvider';
import { SITE } from '@/lib/site';

// Popover "Conta" do ícone de perfil (desktop). Leva às contas de cliente hospedadas na Shopify:
// a página de login de lá já oferece "Iniciar sessão com a Shop" e e-mail/código.
// ponytail: sem sessão no site (sem Customer Account API/OAuth) — os 2 botões de login levam ao
// mesmo login hospedado; integrar OAuth quando quisermos contas nativas.
export default function AccountMenu() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const a = t.header.accountMenu;
  return (
    <div className="acct hd__desk" ref={ref}>
      <button
        type="button"
        className="hd__icon"
        aria-label={t.header.account}
        title={t.header.account}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <i className="fa-regular fa-user" aria-hidden="true" />
      </button>
      {open && (
        <div className="acct__pop" id={id} role="dialog" aria-label={a.title}>
          <p className="acct__title">{a.title}</p>
          <a className="acct__btn acct__btn--shop" href={SITE.accountUrl}>{a.shop}</a>
          <a className="acct__btn acct__btn--main" href={SITE.accountUrl}>{a.other}</a>
          <div className="acct__row">
            <a className="acct__btn acct__btn--ghost" href={`${SITE.accountUrl}/orders`}>
              <i className="fa-regular fa-calendar-check" aria-hidden="true" /> {a.orders}
            </a>
            <a className="acct__btn acct__btn--ghost" href={`${SITE.accountUrl}/profile`}>
              <i className="fa-regular fa-user" aria-hidden="true" /> {a.profile}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
