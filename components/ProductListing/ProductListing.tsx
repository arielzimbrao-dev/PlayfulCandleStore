import type { ReactNode } from 'react';
import Image from 'next/image';
import ProductGridPaged from '@/components/ProductGridPaged/ProductGridPaged';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import ProductFilters from '@/components/ProductFilters/ProductFilters';
import PreFooter from '@/components/PreFooter/PreFooter';
import ShopLayout from '@/components/ShopLayout/ShopLayout';
import JsonLd from '@/components/JsonLd/JsonLd';
import PhotoBanner from '@/components/PhotoBanner/PhotoBanner';
import { itemListLd } from '@/lib/jsonld';
import { applyFilters, availableScents, availableTypes } from '@/lib/filters';
import type { SortOption } from '@/lib/sort';
import type { Image as ShopifyImage, Product } from '@/lib/shopify/types';
import './ProductListing.scss';

type Crumb = { name: string; url: string };

// Página de listagem de uma categoria ou coleção: banner no topo, migalhas, filtros + produtos
// e o bloco pré-footer. O banner pode ser (por ordem de preferência):
//   `photo` → foto desktop/celular com o h1 e a intro visíveis por cima (categorias);
//   `image` → foto simples da coleção.
// No último caso o h1 fica escondido visualmente (só para SEO e leitores de tela).
export default function ProductListing({
  title,
  image,
  photo,
  crumbs,
  basePath,
  products,
  showType,
  sort,
  onlyInStock,
  facets,
  params,
  listName,
  beforeRail,
}: {
  title: string;
  image?: ShopifyImage | null;
  photo?: { desktop: string; mobile: string; alt: string; text: string; textRight?: boolean };
  crumbs: Crumb[];
  basePath: string;
  products: Product[];
  showType: boolean;
  sort: SortOption;
  onlyInStock: boolean;
  facets: { type?: string; scent?: string; price?: string };
  params: Record<string, string | undefined>;
  listName: string;
  /** Secção extra no pré-footer, logo acima da prateleira Best-Sellers. */
  beforeRail?: ReactNode;
}) {
  const stockFiltered = onlyInStock ? products.filter((product) => product.availableForSale) : products;
  const filtered = applyFilters(stockFiltered, facets);

  return (
    <>
      <section className="container">
        <JsonLd data={itemListLd(filtered, listName)} />
        {photo ? (
          <div className="listing-banner">
            <PhotoBanner desktop={photo.desktop} mobile={photo.mobile} alt={photo.alt} textRight={photo.textRight} priority>
              <h1 className="photo-banner__title">{title}</h1>
              <p className="photo-banner__lead">{photo.text}</p>
            </PhotoBanner>
          </div>
        ) : (
          <>
            <h1 className="visually-hidden">{title}</h1>
            {image && (
              <div className="listing-banner listing-banner--photo">
                <Image
                  src={image.url}
                  alt={image.altText ?? title}
                  title={image.altText ?? title}
                  fill
                  sizes="100vw"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>
            )}
          </>
        )}
        <Breadcrumbs items={crumbs} />
        <ShopLayout
          resultCount={filtered.length}
          sortValue={sort.key}
          filters={
            <ProductFilters
              basePath={basePath}
              params={params}
              showType={showType}
              types={showType ? availableTypes(products) : []}
              scents={availableScents(products)}
              stockFilter
            />
          }
        >
          <ProductGridPaged products={filtered} listName={listName} />
        </ShopLayout>
      </section>
      <PreFooter beforeRail={beforeRail} />
    </>
  );
}
