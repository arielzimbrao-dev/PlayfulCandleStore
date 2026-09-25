import Link from 'next/link';
import Image from 'next/image';
import ProductGridPaged from './ProductGridPaged';
import Breadcrumbs from './Breadcrumbs';
import ProductFilters from './ProductFilters';
import PreFooter from './PreFooter';
import SortSelect from './SortSelect';
import JsonLd from './JsonLd';
import { itemListLd } from '@/lib/jsonld';
import { applyFilters, availableScents, availableTypes } from '@/lib/filters';
import type { SortOption } from '@/lib/sort';
import type { Image as ShopImage, Product } from '@/lib/shopify/types';

type Crumb = { name: string; url: string };

// Toggle "Em stock" (o sort é o dropdown SortSelect). Preserva os restantes params.
function StockToggle({ base, params, stock }: { base: string; params: Record<string, string | undefined>; stock: boolean }) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, stock: stock ? '' : '1' })) if (v) p.set(k, v);
  const qs = p.toString();
  return (
    <nav className="sort-bar" aria-label="Filtrar por stock">
      <span className="sort-bar__label">Stock:</span>
      <Link href={qs ? `${base}?${qs}` : base} className={`sort-chip${stock ? ' is-active' : ''}`} aria-pressed={stock}>
        Em stock
      </Link>
    </nav>
  );
}

// Listagem partilhada por /categorias/[handle] (tipos) e /colecoes/[handle] (coleções):
// banner full-bleed + breadcrumb + filtros à esquerda + sort/stock + grelha.
export default function ProductListing({
  eyebrow,
  title,
  text,
  image,
  crumbs,
  basePath,
  products,
  showType,
  sort,
  stock,
  facets,
  params,
  listName,
}: {
  eyebrow: string;
  title: string;
  text?: string | null;
  image?: ShopImage | null;
  crumbs: Crumb[];
  basePath: string;
  products: Product[];
  showType: boolean;
  sort: SortOption;
  stock: boolean;
  facets: { type?: string; scent?: string; price?: string };
  params: Record<string, string | undefined>;
  listName: string;
}) {
  const inStock = stock ? products.filter((p) => p.availableForSale) : products;
  const filtered = applyFilters(inStock, facets);

  return (
    <>
    <section className="container">
      <JsonLd data={itemListLd(filtered, listName)} />
      <div className={`chero${image ? '' : ' chero--plain'}`}>
        {image && (
          <>
            <div className="chero__media">
              <Image src={image.url} alt={image.altText ?? title} fill sizes="100vw" style={{ objectFit: 'cover' }} priority />
            </div>
            <div className="chero__scrim" />
          </>
        )}
        <div className="chero__body">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {text && <p className="chero__text">{text}</p>}
        </div>
      </div>
      <Breadcrumbs items={crumbs} />
      <div className="shop-layout">
        <aside className="shop-layout__aside">
          <h2 className="script-title shop-layout__title">Filtros</h2>
          <ProductFilters
            basePath={basePath}
            params={params}
            showType={showType}
            types={showType ? availableTypes(products) : []}
            scents={availableScents(products)}
          />
        </aside>
        <div className="shop-layout__main">
          <div className="listbar">
            <p className="listbar__count">{filtered.length} {filtered.length === 1 ? 'produto' : 'produtos'}</p>
            <SortSelect value={sort.key} />
            <StockToggle base={basePath} params={params} stock={stock} />
          </div>
          {filtered.length > 0 ? (
            <ProductGridPaged products={filtered} listName={listName} />
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
