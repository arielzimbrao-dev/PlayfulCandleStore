'use client';

import { useState } from 'react';
import ProductGrid from './ProductGrid';
import type { Product } from '@/lib/shopify/types';

// Grelha com "Ver Mais": mostra os primeiros `step` (9) produtos e revela mais a cada clique.
export default function ProductGridPaged({
  products,
  listName,
  step = 9,
}: {
  products: Product[];
  listName: string;
  step?: number;
}) {
  const [visible, setVisible] = useState(step);
  const shown = products.slice(0, visible);
  return (
    <>
      <ProductGrid products={shown} listName={listName} />
      {visible < products.length && (
        <div className="listmore">
          <button type="button" className="listmore__btn" onClick={() => setVisible((v) => v + step)}>
            Ver Mais
          </button>
        </div>
      )}
    </>
  );
}
