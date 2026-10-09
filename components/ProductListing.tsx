import Image from 'next/image';
import ProductGridPaged from './ProductGridPaged';
import Breadcrumbs from './Breadcrumbs';
import ProductFilters from './ProductFilters';
import PreFooter from './PreFooter';
import SortSelect from './SortSelect';
import JsonLd from './JsonLd';
import PhotoBanner from './PhotoBanner';
import { itemListLd } from '@/lib/jsonld';
import { applyFilters, availableScents, availableTypes } from '@/lib/filters';
import type { SortOption } from '@/lib/sort';
import type { Image as ShopImage, Product } from '@/lib/shopify/types';

type Crumb = { name: string; url: string };

export default function ProductListing({
  title,
  image,
  photo,
  art,
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
  title: string;
  image?: ShopImage | null;
  /** Banner foto desktop/mobile com h1 + intro visíveis por cima (categorias). */
  photo?: { desktop: string; mobile: string; alt: string; text: string; textRight?: boolean };
  /** Banner-arte com texto embutido: substitui o hero (sem scrim nem título por cima). */
  art?: { src: string; alt: string; width: number; height: number };
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
      {photo ? (
        <div className="art-banner">
          <PhotoBanner desktop={photo.desktop} mobile={photo.mobile} alt={photo.alt} textRight={photo.textRight} priority>
            <h1 className="pban__title">{title}</h1>
            <p className="pban__lead">{photo.text}</p>
          </PhotoBanner>
        </div>
      ) : (
        /* Hero só-imagem (sem scrim nem texto por cima); o h1 fica para SEO/leitores de ecrã. */
        <h1 className="visually-hidden">{title}</h1>
      )}
      {photo ? null : art ? (
        <div className="art-banner">
          <Image src={art.src} alt={art.alt} width={art.width} height={art.height} sizes="100vw" quality={90} priority className="art-banner__img" />
        </div>
      ) : image && (
        <div className="art-banner art-banner--photo">
          <Image src={image.url} alt={image.altText ?? title} title={image.altText ?? title} fill sizes="100vw" style={{ objectFit: 'cover' }} priority />
        </div>
      )}
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
            stockFilter
          />
        </aside>
        <div className="shop-layout__main">
          <div className="listbar">
            <p className="listbar__count">{filtered.length} {filtered.length === 1 ? 'item' : 'itens'}</p>
            <SortSelect value={sort.key} />
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
