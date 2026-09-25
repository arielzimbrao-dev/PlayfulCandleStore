'use client';

import Image from 'next/image';
import { useT } from './LanguageProvider';
import { SITE } from '@/lib/site';

// Playful VIP (Figma Frame 47) — fundo groovy (imagem), headline branca, botão creme + WhatsApp.
export default function Newsletter() {
  const t = useT();

  return (
    <section className="sec vip" aria-labelledby="vip-h">
      <Image src="/images/figma/vip-bg.jpg" alt="" fill sizes="100vw" quality={90} className="vip__bg" style={{ objectFit: 'cover' }} />
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
