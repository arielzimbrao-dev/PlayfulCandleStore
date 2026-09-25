'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from './LanguageProvider';

// "Escolhe o teu Formato favorito" (Figma Frame 36) — 3 cards quadrados com overlay laranja.
export default function CategoryBento() {
  const t = useT();
  const tiles = [
    { img: '/images/figma/format-velas.jpg', href: '/categorias/velas-de-copo', title: t.nav.velas, text: t.cats.velasText },
    { img: '/images/figma/format-wax.png', href: '/categorias/wax-melts', title: t.nav.wax, text: t.cats.waxText },
    { img: '/images/figma/format-snap.jpg', href: '/categorias/snapbars', title: t.nav.snap, text: t.cats.snapText },
  ];
  return (
    <section className="formats" id="loja" aria-labelledby="cats-h">
      <div className="wrap formats__in">
        <div className="formats__head">
          <p className="eyebrow">{t.cats.eyebrow}</p>
          <h2 id="cats-h" className="script-title script-title--pink">{t.cats.title} <span className="script-spark" aria-hidden="true" /></h2>
        </div>
        <div className="formats__grid">
          {tiles.map((ti) => (
            <Link key={ti.href} href={ti.href} className="tile fmt">
              <Image src={ti.img} alt={ti.title} fill sizes="(max-width: 900px) 100vw, 33vw" quality={90} style={{ objectFit: 'cover' }} />
              <div className="tile__ov" />
              <h3>{ti.title}</h3>
              <p>{ti.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
