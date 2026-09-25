'use client';

import Link from 'next/link';
import Image from 'next/image';
import PagedCarousel from './PagedCarousel';
import ProductCardBig from './ProductCardBig';
import { useT } from './LanguageProvider';
import type { Product } from '@/lib/shopify/types';

// Novidades de Outono (Figma Frame 37) — imagem-destaque colada à esquerda (cantos direitos
// arredondados) + cabeçalho e carrossel de 2 cards à direita.
export default function NovidadesOutono({ products }: { products: Product[] }) {
  const t = useT();
  if (products.length === 0) return null;
  const href = '/colecoes/colecao-de-outono';
  return (
    <section className="novi" aria-labelledby="novi-h">
      <div className="wrap novi__grid">
        <Link className="novi__feature" href={href} aria-label={t.season.newTitle}>
          <Image src="/images/figma/novidades-outono.jpg" alt="" fill sizes="(max-width:900px) 100vw, 45vw" quality={90} style={{ objectFit: 'cover' }} />
        </Link>
        <div className="novi__body">
          <div className="sec__head novi__head">
            <h2 id="novi-h" className="script-title">
              {t.season.newTitle} <span className="script-spark" aria-hidden="true" />
            </h2>
            <Link className="sec__link" href="/produtos">{t.common.seeAll} →</Link>
          </div>
          <PagedCarousel ariaLabel={t.season.newTitle} variant="wrap">
            {products.slice(0, 6).map((p) => (
              <ProductCardBig key={p.id} product={p} soldoutLabel={t.product.soldout} />
            ))}
          </PagedCarousel>
        </div>
      </div>
    </section>
  );
}
