import ProductCarousel from './ProductCarousel';
import { getRelatedProducts, getProducts } from '@/lib/shopify';
import type { Product } from '@/lib/shopify/types';

// Rail "Leva junto" (produtos complementares do Shopify) — com fallback que garante que NUNCA fica vazio:
//   1) getRelatedProducts (COMPLEMENTARY → RELATED → catálogo determinístico)
//   2) se ainda assim vier vazio, best-sellers do catálogo (excluindo o próprio produto).
export default async function LeveJunto({ product, limit = 8 }: { product?: Product; limit?: number }) {
  let items: Product[] = [];

  if (product) {
    items = await getRelatedProducts(product, limit).catch(() => []);
  }

  if (items.length === 0) {
    const best = await getProducts(limit + 4, { sortKey: 'BEST_SELLING' }).catch(() => null);
    items = (best?.products ?? []).filter((p) => !product || p.id !== product.id).slice(0, limit);
  }

  if (items.length === 0) return null;

  return (
    <section className="sec rail" aria-label="Leva junto">
      <div className="wrap">
        <div className="sec__head">
          <div>
            <h2 className="script-title">Leva junto <span className="script-spark" aria-hidden="true" /></h2>
          </div>
        </div>
      </div>
      <ProductCarousel products={items} />
    </section>
  );
}
