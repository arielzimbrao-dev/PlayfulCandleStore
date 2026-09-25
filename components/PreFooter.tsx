import Appeals from './Appeals';
import ProductRail from './ProductRail';
import { getProducts } from '@/lib/shopify';

// Bloco pré-footer (Figma Frames 60/61): barra Appeals + fila Best-Sellers antes do rodapé.
// Server component — busca os best-sellers uma vez por página.
export default async function PreFooter() {
  const best = await getProducts(10, { sortKey: 'BEST_SELLING' }).catch(() => null);
  const products = best?.products ?? [];
  return (
    <>
      <Appeals />
      <ProductRail variant="best" products={products} />
    </>
  );
}
