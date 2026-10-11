'use client';

import Link from 'next/link';
import ProductCarousel from '@/components/ProductRail/ProductCarousel/ProductCarousel';
import { useT } from '@/components/LanguageProvider';
import type { Product } from '@/lib/shopify/types';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import './ProductRail.scss';

type RailVariant = 'best' | 'latest' | 'autumn';

type Props = {
  products: Product[];
  /** Prateleira com título e link "Ver tudo" vindos do dicionário (t.rail[variant]). */
  variant?: RailVariant;
  /** Título fixo (sem link), para prateleiras fora do dicionário. */
  title?: string;
  /** Destino do link "Ver tudo". */
  href?: string;
};

// Prateleira de produtos: título em duas cores + carrossel de cards.
export default function ProductRail({ products, variant, title, href = '/produtos' }: Props) {
  const t = useT();
  if (products.length === 0) return null;
  const copy = variant ? t.rail[variant] : null;
  const heading = title ?? copy?.title ?? '';

  return (
    <section className="section rail" aria-label={heading}>
      <div className="wrap">
        <div className="section__head">
          <h2 className="script-title">
            <TwoToneTitle text={heading} /> <span className="script-spark" aria-hidden="true" />
          </h2>
          {copy && (
            <Link className="section__link" href={href}>
              {copy.link} →
            </Link>
          )}
        </div>
      </div>
      <ProductCarousel products={products} />
    </section>
  );
}
