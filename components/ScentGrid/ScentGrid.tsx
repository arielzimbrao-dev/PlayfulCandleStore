'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/components/LanguageProvider';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import './ScentGrid.scss';

// "Qual é o teu Mood de hoje?" (home): 6 blocos, um por família olfativa, com foto e frase.
// Cada bloco abre a loja já filtrada por esse aroma (?scent=).
// Os nomes são os valores do metafield custom.aromas (em PT), por isso não são traduzidos.
const SCENT_FAMILIES = [
  { key: 'citrico', name: 'Cítrico' },
  { key: 'doce', name: 'Doce' },
  { key: 'floral', name: 'Floral' },
  { key: 'fresco', name: 'Fresco' },
  { key: 'frutado', name: 'Frutado' },
  { key: 'gourmand', name: 'Gourmand' },
] as const;

export default function ScentGrid() {
  const t = useT();
  return (
    <section className="scent-grid" aria-labelledby="scent-grid-title">
      <div className="wrap scent-grid__head">
        <p className="eyebrow">{t.cats.eyebrow}</p>
        <h2 id="scent-grid-title" className="script-title">
          <TwoToneTitle text={t.cats.title} /> <span className="script-spark" aria-hidden="true" />
        </h2>
      </div>
      <div className="scent-grid__list">
        {SCENT_FAMILIES.map((scent) => (
          <Link key={scent.key} href={`/produtos?scent=${encodeURIComponent(scent.name)}`} className="scent-tile">
            <Image
              src={`/images/aromas/groovy-${scent.key}.jpg`}
              alt=""
              fill
              sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 17vw"
              quality={90}
              style={{ objectFit: 'cover' }}
            />
            <h3>{scent.name}</h3>
            <p>{t.cats[scent.key]}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
