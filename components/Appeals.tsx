'use client';

import { useT } from './LanguageProvider';

// Barra de apelos comerciais — conteúdo contido na largura do site, 88px, space-between.
// Os SVGs já trazem o círculo (rosa · laranja · rosa).
const ICONS = ['/icons/appeal-vegan.svg', '/icons/appeal-delivery.svg', '/icons/appeal-payment.svg'];

export default function Appeals() {
  const t = useT();
  return (
    <section className="appeals" aria-label="Vantagens">
      <div className="appeals__in">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo minúsculo; next/image não otimiza SVG */}
        <img className="appeals__star" src="/icons/star.svg" alt="" aria-hidden="true" />
        {/* desktop: display:contents (itens vão direto p/ a grelha); mobile: slide com scroll-snap */}
        <div className="appeals__track">
        {t.appeals.map((a, i) => (
          <div key={a.label} className="appeals__item">
            <span className="appeals__ic">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo minúsculo; next/image não otimiza SVG */}
              <img src={ICONS[i]} alt="" aria-hidden="true" />
            </span>
            <span className="appeals__l">{a.label}</span>
          </div>
        ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo minúsculo; next/image não otimiza SVG */}
        <img className="appeals__star" src="/icons/star.svg" alt="" aria-hidden="true" />
      </div>
    </section>
  );
}
