import Appeals from '@/components/Appeals/Appeals';
import ProductRail from '@/components/ProductRail/ProductRail';
import { getProducts } from '@/lib/shopify';

// Bloco pré-footer (Figma Frames 60/61): barra Appeals + fila Best-Sellers antes do rodapé.
// Componente de servidor — busca os mais vendidos uma vez por página.
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
