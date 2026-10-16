'use client';

import Link from 'next/link';
import { useT } from '@/components/LanguageProvider';
import PhotoBanner from '@/components/PhotoBanner/PhotoBanner';

const HERO_HREF = '/colecoes/colecao-de-outono';

// Hero da home: foto (desktop/celular) sem texto + título e botão em HTML (o h1 da página).
export default function Hero() {
  const t = useT();
  return (
    <section className="hero banner-wall" aria-label={t.hero.eyebrow}>
      <PhotoBanner
        desktop="/images/banners/hero-outono-desktop.jpg"
        mobile="/images/banners/hero-outono-mobile.jpg"
        alt="Wax melt Cinnamon Rolls, snapbar e vela de copo Cappuccino da Coleção de Outono, entre folhas de outono e uma manta de tricô."
        href={HERO_HREF}
        priority
      >
        <p className="eyebrow">{t.hero.eyebrow}</p>
        <h1 className="photo-banner__title">
          {t.hero.titleA} <em>{t.hero.titleEm}</em> {t.hero.titleB}
        </h1>
        <Link className="btn btn--gold" href={HERO_HREF}>
          {t.hero.ctaShop} →
        </Link>
      </PhotoBanner>
    </section>
  );
}
