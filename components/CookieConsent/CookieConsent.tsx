'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/components/LanguageProvider';
import './CookieConsent.scss';

const STORAGE_KEY = 'pc-consent';
// Subir quando as finalidades mudarem: quem já respondeu volta a ver o banner.
const CONSENT_VERSION = 2;
// Evento disparado pelo botão "Gerir cookies" do footer.
export const OPEN_CONSENT_EVENT = 'pc-open-consent';

// RGPD art. 7: precisamos conseguir provar o consentimento. Por isso guardamos as categorias
// escolhidas, a versão do texto e a data — não só um 'granted'/'denied'.
type ConsentChoice = { v: number; ts: string; analytics: boolean; marketing: boolean };

function readStoredChoice(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // Formato antigo ('granted' | 'denied') continua valendo, sem perguntar de novo.
    if (raw === 'granted' || raw === 'denied') {
      const accepted = raw === 'granted';
      return { v: 1, ts: '', analytics: accepted, marketing: accepted };
    }
    const choice = JSON.parse(raw) as ConsentChoice;
    return typeof choice?.analytics === 'boolean' ? choice : null;
  } catch {
    return null;
  }
}

// Repassa a escolha ao Google Consent Mode v2 (as tags ficam bloqueadas até aqui).
function applyToGoogleTags({ analytics, marketing }: { analytics: boolean; marketing: boolean }) {
  const toGoogleValue = (allowed: boolean) => (allowed ? 'granted' : 'denied');
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.('consent', 'update', {
    analytics_storage: toGoogleValue(analytics),
    ad_storage: toGoogleValue(marketing),
    ad_user_data: toGoogleValue(marketing),
    ad_personalization: toGoogleValue(marketing),
  });
}

// Banner de cookies (RGPD). Tudo fica negado até o visitante aceitar.
export default function CookieConsent() {
  const t = useT();
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = readStoredChoice();
    if (stored && stored.v >= CONSENT_VERSION) applyToGoogleTags(stored);
    else setIsVisible(true);

    // Reabrir o banner para gerir/retirar o consentimento (RGPD: retirar tem de ser tão fácil quanto dar).
    const reopen = () => {
      const current = readStoredChoice();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setIsCustomizing(false);
      setIsVisible(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  const saveChoice = (allowAnalytics: boolean, allowMarketing: boolean) => {
    const choice: ConsentChoice = {
      v: CONSENT_VERSION,
      ts: new Date().toISOString(),
      analytics: allowAnalytics,
      marketing: allowMarketing,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch {
      /* armazenamento bloqueado: vale só para esta visita */
    }
    applyToGoogleTags(choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="consent" role="dialog" aria-label={t.consent.title} aria-live="polite">
      <div className="consent__body">
        <p className="consent__text">
          <strong>{t.consent.title}</strong> {t.consent.text}
        </p>

        {isCustomizing && (
          <div className="consent__categories">
            <label className="consent__category">
              <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
              <span>
                <strong>{t.consent.analytics}</strong> {t.consent.analyticsText}
              </span>
            </label>
            <label className="consent__category">
              <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />
              <span>
                <strong>{t.consent.marketing}</strong> {t.consent.marketingText}
              </span>
            </label>
          </div>
        )}

        <div className="consent__actions">
          <button type="button" className="btn btn--outline btn--compact" onClick={() => saveChoice(false, false)}>
            {t.consent.reject}
          </button>
          {isCustomizing ? (
            <button
              type="button"
              className="btn btn--outline btn--compact"
              onClick={() => saveChoice(analytics, marketing)}
            >
              {t.consent.save}
            </button>
          ) : (
            <button type="button" className="btn btn--outline btn--compact" onClick={() => setIsCustomizing(true)}>
              {t.consent.customize}
            </button>
          )}
          <button type="button" className="btn btn--primary btn--compact" onClick={() => saveChoice(true, true)}>
            {t.consent.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
