'use client';

import { useState } from 'react';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import type { Product } from '@/lib/shopify/types';
import './ProductGridPaged.scss';

// Grade com botão "Ver Mais": mostra os primeiros `pageSize` produtos e revela mais a cada clique.
export default function ProductGridPaged({
  products,
  listName,
  pageSize = 9,
}: {
  products: Product[];
  listName: string;
  pageSize?: number;
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  return (
    <>
      <ProductGrid products={products.slice(0, visibleCount)} listName={listName} />
      {visibleCount < products.length && (
        <div className="load-more">
          <button type="button" className="load-more__button" onClick={() => setVisibleCount((count) => count + pageSize)}>
            Ver Mais
          </button>
        </div>
      )}
    </>
  );
}
