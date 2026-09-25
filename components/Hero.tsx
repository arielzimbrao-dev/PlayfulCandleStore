'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from './LanguageProvider';
import GroovyBg from './GroovyBg';

// Desktop: banner-imagem (arte com texto embutido, clicável).
// Mobile: hero HTML funcional (texto/botão reais, legível). Alternam por CSS.
// O <h1> real vive no bloco mobile (fica em DOM sempre, é o h1 da página para SEO).
export default function Hero() {
  const t = useT();
  return (
    <section className="hero" aria-label={t.hero.eyebrow}>
      {/* h1 real da página — sempre no DOM/a11y tree (visível como imagem no desktop, texto no mobile) */}
      <h1 className="visually-hidden">{t.hero.titleA} {t.hero.titleEm} {t.hero.titleB}</h1>
      <Link
        href="/produtos"
        className="hero-img__link"
        aria-label={`${t.hero.titleA} ${t.hero.titleEm} ${t.hero.titleB} — ${t.hero.ctaShop}`}
      >
        <Image
          src="/images/hero.jpg"
          alt="Playful Candles — Mais cor para os teus dias. Velas artesanais de cera vegetal."
          width={1214}
          height={310}
          priority
          quality={90}
          sizes="100vw"
          className="hero-img__pic"
        />
      </Link>

      <div className="hero-m">
        <GroovyBg className="hero-m__bg" />
        <div className="hero-m__c">
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <p className="hero-m__title" aria-hidden="true">
            {t.hero.titleA} <em>{t.hero.titleEm}</em> {t.hero.titleB}
          </p>
          <p className="hero-m__lead">{t.hero.lead}</p>
          <Link className="btn btn--gold" href="/produtos">{t.hero.ctaShop} →</Link>
        </div>
      </div>
    </section>
  );
}
