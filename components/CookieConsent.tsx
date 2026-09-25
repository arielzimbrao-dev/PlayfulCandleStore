'use client';

import { useEffect, useState } from 'react';
import { useT } from './LanguageProvider';

const KEY = 'pc-consent';
const VERSION = 2; // subir quando as finalidades mudarem → o banner volta a aparecer

// RGPD Art. 7: temos de conseguir demonstrar o consentimento. Guardamos as categorias escolhidas,
// a versão do texto e a data — não só um 'granted'/'denied'.
type Choice = { v: number; ts: string; analytics: boolean; marketing: boolean };

// Formato antigo ('granted' | 'denied') → continua a valer, sem voltar a pedir a quem já respondeu.
function read(): Choice | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    if (raw === 'granted' || raw === 'denied') {
      const on = raw === 'granted';
      return { v: 1, ts: '', analytics: on, marketing: on };
    }
    const c = JSON.parse(raw) as Choice;
    return typeof c?.analytics === 'boolean' ? c : null;
  } catch {
    return null;
  }
}

function apply({ analytics, marketing }: { analytics: boolean; marketing: boolean }) {
  const yn = (b: boolean) => (b ? 'granted' : 'denied');
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.('consent', 'update', {
    analytics_storage: yn(analytics),
    ad_storage: yn(marketing),
    ad_user_data: yn(marketing),
    ad_personalization: yn(marketing),
  });
}

// GDPR consent banner + Consent Mode v2. Tags stay denied until the visitor accepts.
export default function CookieConsent() {
  const t = useT();
  const [show, setShow] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const stored = read();
    if (stored && stored.v >= VERSION) apply(stored);
    else setShow(true);

    // Permite reabrir o banner para gerir/retirar o consentimento (RGPD: retirar tão fácil como dar).
    const reopen = () => {
      const c = read();
      setAnalytics(c?.analytics ?? true);
      setMarketing(c?.marketing ?? true);
      setCustom(false);
      setShow(true);
    };
    window.addEventListener('pc-open-consent', reopen);
    return () => window.removeEventListener('pc-open-consent', reopen);
  }, []);

  const choose = (a: boolean, m: boolean) => {
    const choice: Choice = { v: VERSION, ts: new Date().toISOString(), analytics: a, marketing: m };
    try {
      localStorage.setItem(KEY, JSON.stringify(choice));
    } catch {
      /* ignore */
    }
    apply(choice);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="consent" role="dialog" aria-label={t.consent.title} aria-live="polite">
      <div className="consent__body">
        <p className="consent__text">
          <strong>{t.consent.title}</strong> {t.consent.text}
        </p>

        {custom && (
          <div className="consent__cats">
            <label className="consent__cat">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
              <span>
                <strong>{t.consent.analytics}</strong> {t.consent.analyticsText}
              </span>
            </label>
            <label className="consent__cat">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
              <span>
                <strong>{t.consent.marketing}</strong> {t.consent.marketingText}
              </span>
            </label>
          </div>
        )}

        <div className="consent__actions">
          <button type="button" className="btn btn--outline consent__btn" onClick={() => choose(false, false)}>
            {t.consent.reject}
          </button>
          {custom ? (
            <button type="button" className="btn btn--outline consent__btn" onClick={() => choose(analytics, marketing)}>
              {t.consent.save}
            </button>
          ) : (
            <button type="button" className="btn btn--outline consent__btn" onClick={() => setCustom(true)}>
              {t.consent.customize}
            </button>
          )}
          <button type="button" className="btn btn--primary consent__btn" onClick={() => choose(true, true)}>
            {t.consent.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
