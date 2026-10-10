'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from './LanguageProvider';
import TwoTone from './TwoTone';

// "Escolhe o teu Aroma favorito" — 6 tiles (um por família olfativa), foto real de um produto
// dessa família + nome e frase; cada tile abre a loja já filtrada por esse aroma (?scent=).
// Os nomes são os valores do metafield custom.aromas (PT), por isso não se traduzem.
const AROMAS = [
  { key: 'citrico', name: 'Cítrico' },
  { key: 'doce', name: 'Doce' },
  { key: 'floral', name: 'Floral' },
  { key: 'fresco', name: 'Fresco' },
  { key: 'frutado', name: 'Frutado' },
  { key: 'gourmand', name: 'Gourmand' },
] as const;

export default function CategoryBento() {
  const t = useT();
  return (
    <section className="formats" aria-labelledby="cats-h">
      <div className="wrap formats__in">
        <div className="formats__head">
          <p className="eyebrow">{t.cats.eyebrow}</p>
          <h2 id="cats-h" className="script-title"><TwoTone text={t.cats.title} /> <span className="script-spark" aria-hidden="true" /></h2>
        </div>
      </div>
      <div className="formats__grid">
        {AROMAS.map((a) => (
          <Link key={a.key} href={`/produtos?scent=${encodeURIComponent(a.name)}`} className="tile fmt">
            <Image src={`/images/aromas/groovy-${a.key}.jpg`} alt="" fill sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 17vw" quality={90} style={{ objectFit: 'cover' }} />
            <h3>{a.name}</h3>
            <p>{t.cats[a.key]}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
