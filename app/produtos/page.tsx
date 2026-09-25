import type { Metadata } from 'next';
import ProductGridPaged from '@/components/ProductGridPaged';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductFilters from '@/components/ProductFilters';
import PreFooter from '@/components/PreFooter';
import SortSelect from '@/components/SortSelect';
import JsonLd from '@/components/JsonLd';
import { itemListLd } from '@/lib/jsonld';
import { getProducts } from '@/lib/shopify';
import { applyFilters, availableScents, availableTypes } from '@/lib/filters';
import { resolveSort } from '@/lib/sort';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Loja — todas as velas',
  description: 'Vê todas as velas de copo, wax melts, snapbars e queimadores da Playful Candles. Feito à mão em Lisboa.',
  alternates: { canonical: '/produtos' },
};

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; type?: string; scent?: string; price?: string }>;
}) {
  const sp = await searchParams;
  const sort = resolveSort(sp.sort);
  // Catálogo pequeno: busca tudo e filtra em memória (facetas tipo/aroma/preço).
  const { products } = await getProducts(250, { sortKey: sort.product, reverse: sort.reverse });

  const params = { sort: sort.key, type: sp.type, scent: sp.scent, price: sp.price };
  const filtered = applyFilters(products, params);

  return (
    <>
    <section className="container">
      <JsonLd data={itemListLd(filtered, 'Loja')} />
      <Breadcrumbs items={[{ name: 'Início', url: '/' }, { name: 'Loja', url: '/produtos' }]} />
      <div className="sec__head">
        <div>
          <h1>Loja</h1>
        </div>
      </div>

      <div className="shop-layout">
        <aside className="shop-layout__aside">
          <h2 className="script-title shop-layout__title">Filtros</h2>
          <ProductFilters
            basePath="/produtos"
            params={params}
            showType
            types={availableTypes(products)}
            scents={availableScents(products)}
          />
        </aside>

        <div className="shop-layout__main">
          <div className="listbar">
            <p className="listbar__count">{filtered.length} {filtered.length === 1 ? 'produto' : 'produtos'}</p>
            <SortSelect value={sort.key} />
          </div>
          {filtered.length > 0 ? (
            <ProductGridPaged products={filtered} listName="Loja" />
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--ink-soft)', margin: '2.5rem 0' }}>
              Nada com estes filtros. Experimenta limpar. ✨
            </p>
          )}
        </div>
      </div>
    </section>
    <PreFooter />
    </>
  );
}
