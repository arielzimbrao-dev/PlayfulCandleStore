import type { ReactNode } from 'react';
import Appeals from '@/components/Appeals/Appeals';
import ProductRail from '@/components/ProductRail/ProductRail';
import { getProducts } from '@/lib/shopify';
import { withPackSavings } from '@/lib/bundle';

// Bloco pré-footer (Figma Frames 60/61): barra Appeals + fila Best-Sellers antes do rodapé.
// Componente de servidor — busca os mais vendidos uma vez por página.
// `beforeRail`: secção extra logo acima da prateleira (ex.: "Como usar" nas categorias de cera).
export default async function PreFooter({ beforeRail }: { beforeRail?: ReactNode } = {}) {
  const best = await getProducts(10, { sortKey: 'BEST_SELLING' }).catch(() => null);
  const products = await withPackSavings(best?.products ?? []);
  return (
    <>
      <Appeals />
      {beforeRail}
      <ProductRail variant="best" products={products} />
    </>
  );
}
