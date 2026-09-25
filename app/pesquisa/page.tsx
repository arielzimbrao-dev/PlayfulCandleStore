import type { Metadata } from 'next';
import { getProducts, searchProducts } from '@/lib/shopify';
import ProductGrid from '@/components/ProductGrid';
import ProductRail from '@/components/ProductRail';
import ProductFilters from '@/components/ProductFilters';
import SearchResultsHeader from '@/components/SearchResultsHeader';
import { applyFilters, availableScents, availableTypes } from '@/lib/filters';

export const metadata: Metadata = {
  title: 'Pesquisa',
  robots: { index: false, follow: true }, // search result pages shouldn't be indexed
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; scent?: string; price?: string }>;
}) {
  const sp = await searchParams;
  const term = (sp.q ?? '').trim();
  const results = term ? await searchProducts(term, 50) : [];
  const params = { q: term, type: sp.type, scent: sp.scent, price: sp.price };
  const filtered = applyFilters(results, params);
  const noResults = results.length === 0;
  const suggestions = noResults ? (await getProducts(10, { sortKey: 'BEST_SELLING' })).products : [];

  return (
    <>
      <section className="container">
        <SearchResultsHeader q={term} count={filtered.length} />
        {results.length > 0 && (
          <div className="shop-layout">
            <aside className="shop-layout__aside">
              <ProductFilters
                basePath="/pesquisa"
                params={params}
                showType
                types={availableTypes(results)}
                scents={availableScents(results)}
              />
            </aside>
            <div className="shop-layout__main">
              {filtered.length > 0 ? (
                <ProductGrid products={filtered} listName={`Pesquisa: ${term}`} />
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--ink-soft)', margin: '2.5rem 0' }}>
                  Nada com estes filtros. Experimenta limpar. ✨
                </p>
              )}
            </div>
          </div>
        )}
      </section>
      {noResults && <ProductRail variant="best" products={suggestions} />}
    </>
  );
}
