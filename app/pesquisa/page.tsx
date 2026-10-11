import type { Metadata } from 'next';
import { getProducts, searchProducts } from '@/lib/shopify';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import ProductRail from '@/components/ProductRail/ProductRail';
import ProductFilters from '@/components/ProductFilters/ProductFilters';
import ShopLayout from '@/components/ShopLayout/ShopLayout';
import SearchResultsHeader from '@/components/SearchResultsHeader/SearchResultsHeader';
import { applyFilters, availableScents, availableTypes } from '@/lib/filters';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Pesquisa',
  robots: { index: false, follow: true }, // páginas de resultado de pesquisa não devem ser indexadas
};

// /pesquisa?q=: resultados com filtros. Sem resultados, sugere os mais vendidos.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; scent?: string; price?: string }>;
}) {
  const query = await searchParams;
  const term = (query.q ?? '').trim();
  const results = term ? await searchProducts(term, 50) : [];
  const params = { q: term, type: query.type, scent: query.scent, price: query.price };
  const filtered = applyFilters(results, params);
  const hasNoResults = results.length === 0;
  const bestSellers = hasNoResults ? (await getProducts(10, { sortKey: 'BEST_SELLING' })).products : [];

  return (
    <>
      <section className="container">
        <Breadcrumbs
          items={[
            { name: 'Início', url: '/' },
            { name: 'Pesquisa', url: '/pesquisa' },
          ]}
        />
        <SearchResultsHeader term={term} count={filtered.length} />
        {!hasNoResults && (
          <ShopLayout
            resultCount={filtered.length}
            filters={
              <ProductFilters
                basePath="/pesquisa"
                params={params}
                showType
                types={availableTypes(results)}
                scents={availableScents(results)}
              />
            }
          >
            <ProductGrid products={filtered} listName={`Pesquisa: ${term}`} />
          </ShopLayout>
        )}
      </section>
      {hasNoResults && <ProductRail variant="best" products={bestSellers} />}
    </>
  );
}
