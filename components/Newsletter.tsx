'use client';

import { useT } from './LanguageProvider';
import { SITE } from '@/lib/site';

// Playful VIP — vive no topo do footer e partilha o fundo dele (headline branca, botão creme + WhatsApp).
export default function Newsletter() {
  const t = useT();

  return (
    <section className="vip" aria-labelledby="vip-h">
      <div className="wrap">
        <div className="vip__c">
          <p className="eyebrow vip__eyebrow">Playful VIP</p>
          <h2 id="vip-h">{t.news.title}</h2>
          <p>{t.news.text}</p>
          <a className="btn vip__cta" href={SITE.vipGroup} target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-whatsapp" aria-hidden="true" /> {t.news.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
