'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from './LanguageProvider';

// "Escolhe o teu Formato favorito" (Figma Frame 36) — cabeçalho na largura do site,
// 4 cards quadrados full-bleed (um por categoria), quase colados, texto branco sobre a foto.
export default function CategoryBento() {
  const t = useT();
  const tiles = [
    { img: '/images/formats/velas.jpg', href: '/categorias/velas-de-copo', title: t.nav.velas, text: t.cats.velasText },
    { img: '/images/formats/wax.jpg', href: '/categorias/wax-melts', title: t.nav.wax, text: t.cats.waxText },
    { img: '/images/formats/snap.jpg', href: '/categorias/snapbars', title: t.nav.snap, text: t.cats.snapText },
    { img: '/images/formats/queimador.jpg', href: '/categorias/queimadores', title: t.nav.burner, text: t.cats.burnerText },
  ];
  return (
    <section className="formats" id="loja" aria-labelledby="cats-h">
      <div className="wrap formats__in">
        <div className="formats__head">
          <p className="eyebrow">{t.cats.eyebrow}</p>
          <h2 id="cats-h" className="script-title script-title--pink">{t.cats.title} <span className="script-spark" aria-hidden="true" /></h2>
        </div>
      </div>
      <div className="formats__grid">
        {tiles.map((ti) => (
          <Link key={ti.href} href={ti.href} className="tile fmt">
            <Image src={ti.img} alt={ti.title} fill sizes="(max-width: 900px) 50vw, 25vw" quality={90} style={{ objectFit: 'cover' }} />
            <h3>{ti.title}</h3>
            <p>{ti.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
