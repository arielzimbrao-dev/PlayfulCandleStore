'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { useT } from '@/components/LanguageProvider';
import { useDismiss } from '@/components/useDismiss';
import { SITE } from '@/lib/site';
import './AccountMenu.scss';

// Popover "Conta" do ícone de perfil (só desktop). Leva às contas de cliente hospedadas na Shopify:
// a página de login de lá já oferece "Iniciar sessão com a Shop" e e-mail/código.
// ponytail: sem sessão no site (sem Customer Account API/OAuth) — os 2 botões de login levam ao
// mesmo login hospedado; integrar OAuth quando quisermos contas nativas.
export default function AccountMenu() {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(rootRef, isOpen, close);

  const copy = t.header.accountMenu;
  return (
    <div className="account-menu header__desktop-only" ref={rootRef}>
      <button
        type="button"
        className="header__icon-button"
        aria-label={t.header.account}
        title={t.header.account}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <i className="fa-regular fa-user" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="account-menu__popover" id={popoverId} role="dialog" aria-label={copy.title}>
          <p className="account-menu__title">{copy.title}</p>
          <a className="account-menu__button account-menu__button--shop" href={SITE.accountUrl}>
            {copy.shop}
          </a>
          <a className="account-menu__button account-menu__button--main" href={SITE.accountUrl}>
            {copy.other}
          </a>
          <div className="account-menu__row">
            <a className="account-menu__button account-menu__button--ghost" href={`${SITE.accountUrl}/orders`}>
              <i className="fa-regular fa-calendar-check" aria-hidden="true" /> {copy.orders}
            </a>
            <a className="account-menu__button account-menu__button--ghost" href={`${SITE.accountUrl}/profile`}>
              <i className="fa-regular fa-user" aria-hidden="true" /> {copy.profile}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
