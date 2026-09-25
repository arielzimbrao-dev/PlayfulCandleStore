'use client';

import ProductCardBig from './ProductCardBig';
import PagedCarousel from './PagedCarousel';
import { useT } from './LanguageProvider';
import type { Product } from '@/lib/shopify/types';

export default function ProductCarousel({ products, firstBadge }: { products: Product[]; firstBadge?: string }) {
  const t = useT();
  if (products.length === 0) return null;
  return (
    <PagedCarousel ariaLabel="Produtos" variant="wrap">
      {products.map((p, i) => (
        <ProductCardBig key={p.id} product={p} badge={i === 0 ? firstBadge : undefined} soldoutLabel={t.product.soldout} />
      ))}
    </PagedCarousel>
  );
}
