import ProductRail from '@/components/ProductRail/ProductRail';
import { getRelatedProducts, getProducts } from '@/lib/shopify';
import type { Product } from '@/lib/shopify/types';

// Prateleira "Compra também" da PDP. Nunca fica vazia:
//   1) getRelatedProducts (COMPLEMENTARY → RELATED → catálogo determinístico);
//   2) se ainda assim não vier nada, os mais vendidos (sem o próprio produto).
export default async function RelatedProducts({ product, limit = 8 }: { product?: Product; limit?: number }) {
  let related: Product[] = [];

  if (product) {
    related = await getRelatedProducts(product, limit).catch(() => []);
  }

  if (related.length === 0) {
    const bestSellers = await getProducts(limit + 4, { sortKey: 'BEST_SELLING' }).catch(() => null);
    related = (bestSellers?.products ?? []).filter((candidate) => candidate.id !== product?.id).slice(0, limit);
  }

  return <ProductRail title="Compra mais" products={related} />;
}
