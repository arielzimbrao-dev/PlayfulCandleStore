import type { Metadata } from 'next';
import ProductGridPaged from '@/components/ProductGridPaged/ProductGridPaged';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import ProductFilters from '@/components/ProductFilters/ProductFilters';
import PreFooter from '@/components/PreFooter/PreFooter';
import ShopLayout from '@/components/ShopLayout/ShopLayout';
import JsonLd from '@/components/JsonLd/JsonLd';
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

// /produtos: o catálogo inteiro, com filtros de categoria, aroma e preço.
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; type?: string; scent?: string; price?: string }>;
}) {
  const query = await searchParams;
  const sort = resolveSort(query.sort);
  // O catálogo é pequeno: busca tudo de uma vez e filtra em memória.
  const { products } = await getProducts(250, { sortKey: sort.product, reverse: sort.reverse });

  const params = { sort: sort.key, type: query.type, scent: query.scent, price: query.price };
  const filtered = applyFilters(products, params);

  return (
    <>
      <section className="container">
        <JsonLd data={itemListLd(filtered, 'Loja')} />
        <Breadcrumbs
          items={[
            { name: 'Início', url: '/' },
            { name: 'Loja', url: '/produtos' },
          ]}
        />
        <div className="section__head">
          <h1>Loja</h1>
        </div>

        <ShopLayout
          resultCount={filtered.length}
          sortValue={sort.key}
          filters={
            <ProductFilters
              basePath="/produtos"
              params={params}
              showType
              types={availableTypes(products)}
              scents={availableScents(products)}
            />
          }
        >
          <ProductGridPaged products={filtered} listName="Loja" />
        </ShopLayout>
      </section>
      <PreFooter />
    </>
  );
}
