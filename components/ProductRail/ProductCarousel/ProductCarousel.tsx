'use client';

import ProductCard from '@/components/ProductCard/ProductCard';
import PagedCarousel from '@/components/PagedCarousel/PagedCarousel';
import { useT } from '@/components/LanguageProvider';
import type { Product } from '@/lib/shopify/types';

// Carrossel de cards de produto (as larguras dos cards ficam em ProductRail.scss).
export default function ProductCarousel({ products }: { products: Product[] }) {
  const t = useT();
  if (products.length === 0) return null;
  return (
    <PagedCarousel ariaLabel="Produtos">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} soldOutLabel={t.product.soldout} />
      ))}
    </PagedCarousel>
  );
}
