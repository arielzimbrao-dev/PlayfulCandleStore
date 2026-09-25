'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from './LanguageProvider';

// Banner "Coleção Outono — Vem aí" (imagem do Figma, clicável, full-bleed).
export default function SeasonalCollection() {
  const t = useT();
  const href = '/colecoes/colecao-de-outono';
  return (
    <section className="coleccao" aria-label={t.season.title}>
      <Link href={href} className="coleccao__link" aria-label={`${t.season.title} — ${t.season.cta}`}>
        <Image
          src="/images/figma/coleccao-outono.jpg"
          alt={`${t.season.title} — ${t.season.badge}. ${t.season.cta}.`}
          width={1518}
          height={214}
          sizes="100vw"
          quality={90}
          className="coleccao__img"
        />
      </Link>
    </section>
  );
}
