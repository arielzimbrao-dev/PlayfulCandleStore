'use client';

import Link from 'next/link';
import { useT } from '@/components/LanguageProvider';
import PhotoBanner from '@/components/PhotoBanner/PhotoBanner';
import './Hero.scss';

const HERO_HREF = '/colecoes/colecao-de-outono';

// Hero da home: foto (desktop/celular) sem texto + título e botão em HTML (o h1 da página).
export default function Hero() {
  const t = useT();
  return (
    <section className="hero" aria-label={t.hero.eyebrow}>
      <PhotoBanner
        desktop="/images/banners/hero-groovy-desktop.jpg"
        mobile="/images/banners/hero-groovy-mobile-45.jpg"
        alt="Velas de copo Lemon & Raspberry e Purple Vanilla acesas, entre limões, framboesas, flores e baunilha."
        href={HERO_HREF}
        priority
      >
        <p className="eyebrow">{t.hero.eyebrow}</p>
        <h1 className="photo-banner__title">
          {t.hero.titleA} <em>{t.hero.titleEm}</em> {t.hero.titleB}
        </h1>
        <p className="photo-banner__lead">{t.hero.lead}</p>
        <Link className="btn btn--gold" href={HERO_HREF}>
          {t.hero.ctaShop} →
        </Link>
      </PhotoBanner>
    </section>
  );
}
