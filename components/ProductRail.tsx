'use client';

import Link from 'next/link';
import ProductCarousel from './ProductCarousel';
import { useT } from './LanguageProvider';
import type { Product } from '@/lib/shopify/types';

type Props = { variant: 'best' | 'latest'; products: Product[]; id?: string; wave?: string };

export default function ProductRail({ variant, products, id, wave }: Props) {
  const t = useT();
  if (products.length === 0) return null;
  const c = t.rail[variant];
  return (
    <section className="sec rail" id={id} aria-label={c.title}>
      <div className="wrap">
        <div className="sec__head">
          <div>
            <h2 className="script-title">{c.title} <span className="script-spark" aria-hidden="true">✦</span></h2>
          </div>
          <Link className="sec__link" href="/produtos">{c.link} →</Link>
        </div>
      </div>
      <ProductCarousel products={products} firstBadge={c.badge} />
      {wave && (
        <div className="wv" style={{ color: wave }} aria-hidden="true">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,34 C240,60 520,6 720,26 C920,46 1200,8 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      )}
    </section>
  );
}
