'use client';

import { useT } from '@/components/LanguageProvider';
import './Appeals.scss';

// Ícone de cada apelo, na mesma ordem dos textos em t.appeals (os SVGs já trazem o círculo colorido).
const ICONS = ['/icons/appeal-vegan.svg', '/icons/appeal-delivery.svg', '/icons/appeal-payment.svg'];

// Barra com os 3 apelos da loja (vegano · entrega · pagamento), entre duas estrelinhas.
// No celular mostra um apelo de cada vez, deslizando com o dedo.
export default function Appeals() {
  const t = useT();
  return (
    <section className="appeals" aria-label="Vantagens">
      <div className="appeals__inner">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo pequeno; o next/image não otimiza SVG */}
        <img className="appeals__star" src="/icons/star.svg" alt="" aria-hidden="true" />
        <div className="appeals__track">
          {t.appeals.map((appeal, index) => (
            <div key={appeal.label} className="appeals__item">
              <span className="appeals__icon">
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo pequeno; o next/image não otimiza SVG */}
                <img src={ICONS[index]} alt="" aria-hidden="true" />
              </span>
              <span>{appeal.label}</span>
            </div>
          ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo pequeno; o next/image não otimiza SVG */}
        <img className="appeals__star" src="/icons/star.svg" alt="" aria-hidden="true" />
      </div>
    </section>
  );
}
