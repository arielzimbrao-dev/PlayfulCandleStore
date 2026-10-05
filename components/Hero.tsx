'use client';

import Link from 'next/link';
import { useT } from './LanguageProvider';
import PhotoBanner from './PhotoBanner';

// Hero: foto (desktop/mobile) sem texto + título/CTA reais em HTML (h1 da página).
export default function Hero() {
  const t = useT();
  const href = '/colecoes/colecao-de-outono';
  return (
    <section className="hero" aria-label={t.hero.eyebrow}>
      <PhotoBanner
        desktop="/images/banners/home-hero-desktop.jpg"
        mobile="/images/banners/home-hero-mobile.jpg"
        alt="Velas artesanais Pumpkin Spice e Cappuccino entre pinhas e folhas de outono."
        href={href}
        priority
      >
        <p className="eyebrow">{t.hero.eyebrow}</p>
        <h1 className="pban__title">
          {t.hero.titleA} <em>{t.hero.titleEm}</em> {t.hero.titleB}
        </h1>
        <p className="pban__lead">{t.hero.lead}</p>
        <Link className="btn btn--gold" href={href}>{t.hero.ctaShop} →</Link>
      </PhotoBanner>
    </section>
  );
}
