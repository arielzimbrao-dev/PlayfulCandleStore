'use client';

import { useT } from './LanguageProvider';

// Barra de apelos comerciais — conteúdo contido na largura do site, 88px, space-between.
// Item do meio (entregas) traz o círculo laranja no SVG; os outros assentam em círculo rosa.
const ICONS = [
  { src: '/icons/appeal-vegan.svg', circle: true },
  { src: '/icons/appeal-delivery.svg', circle: false },
  { src: '/icons/appeal-payment.svg', circle: true },
];

export default function Appeals() {
  const t = useT();
  return (
    <section className="appeals" aria-label="Vantagens">
      <div className="appeals__in">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo minúsculo; next/image não otimiza SVG */}
        <img className="appeals__star" src="/icons/star.svg" alt="" aria-hidden="true" />
        {t.appeals.map((a, i) => (
          <div key={a.label} className="appeals__item">
            <span className={`appeals__ic${ICONS[i].circle ? ' appeals__ic--circle' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo minúsculo; next/image não otimiza SVG */}
              <img src={ICONS[i].src} alt="" aria-hidden="true" />
            </span>
            <span className="appeals__l">{a.label}</span>
          </div>
        ))}
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo minúsculo; next/image não otimiza SVG */}
        <img className="appeals__star" src="/icons/star.svg" alt="" aria-hidden="true" />
      </div>
      <p className="appeals__note">{t.appealsNote}</p>
    </section>
  );
}
