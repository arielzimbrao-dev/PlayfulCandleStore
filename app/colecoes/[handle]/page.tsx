import { OG_BASE } from '@/lib/site';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ProductListing from '@/components/ProductListing/ProductListing';
import { getCollection } from '@/lib/shopify';
import { withPackSavings } from '@/lib/bundle';
import { resolveSort } from '@/lib/sort';
import { CATEGORIES } from '@/lib/categories';

export const revalidate = 3600;

// Banners de foto por coleção (desktop 3:1 / mobile 4:5, texto em HTML por cima).
// ponytail: mapa fixo; passar para um metafield se crescer.
const PHOTO_BANNERS: Record<
  string,
  { title?: string; desktop: string; mobile: string; alt: string; text: string; light?: boolean }
> = {
  'colecao-de-outono': {
    title: 'Autumn Collection', // em inglês: a fonte Genty não tem ç/ã
    desktop: '/images/banners/col-outono-v4-desktop.jpg',
    mobile: '/images/banners/col-outono-v3-mobile.jpg',
    alt: 'Velas Orange & Cinnamon, Pumpkin Spice e Cappuccino entre folhas de outono, abóboras, paus de canela e laranja seca',
    text: 'Canela, café e abóbora num trio a pensar no outono. Acende uma, puxa a manta e deixa-te ficar.',
    light: true,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  if (CATEGORIES[handle]) return {}; // é uma categoria — a página redireciona
  const collection = await getCollection(handle, 1);
  if (!collection) return { title: 'Coleção não encontrada', robots: { index: false, follow: true } };
  return {
    title: collection.seo.title || collection.title,
    description:
      collection.seo.description || collection.description || `${collection.title} — velas artesanais Playful Candles.`,
    alternates: { canonical: `/colecoes/${handle}` },
    openGraph: collection.image ? { ...OG_BASE, images: [{ url: collection.image.url }] } : undefined,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; stock?: string; type?: string; scent?: string; price?: string }>;
}) {
  const { handle } = await params;
  // As categorias já viveram em /colecoes/ antes de irem para /categorias/ — redireciona links antigos.
  if (CATEGORIES[handle]) redirect(`/categorias/${handle}`);

  const query = await searchParams;
  const sort = resolveSort(query.sort);
  const onlyInStock = query.stock === '1';
  const facets = { type: query.type, scent: query.scent, price: query.price };
  const filterParams = { sort: sort.key, stock: onlyInStock ? '1' : undefined, ...facets };

  const collection = await getCollection(handle, 250, { sortKey: sort.collection, reverse: sort.reverse });
  if (!collection) notFound();

  // Banner: usa a imagem da coleção; se não tiver (comum na Shopify), usa uma foto da marca.
  const bannerImage = collection.image ?? {
    url: '/images/instagram/ig1.jpg',
    altText: collection.title,
    width: null,
    height: null,
  };
  // Breadcrumb curto: "Coleção de Outono" → "Outono".
  const shortTitle = collection.title.replace(/^Cole[çc][ãa]o de\s+/i, '');
  const crumbs = [
    { name: 'Início', url: '/' },
    { name: 'Coleções', url: '/colecoes' },
    { name: shortTitle, url: `/colecoes/${handle}` },
  ];

  const photoBanner = PHOTO_BANNERS[handle];
  // Outono: nos produtos que não são packs nem wax melts, o card começa na 2.ª foto.
  const shown =
    handle === 'colecao-de-outono'
      ? collection.products.map((product) =>
          !['Pack', 'Wax Melt'].includes(product.productType) && product.images.length > 1
            ? { ...product, featuredImage: product.images[1], images: product.images.slice(1) }
            : product,
        )
      : collection.products;
  // "Em Destaque": os packs da coleção aparecem primeiro (sort estável mantém a ordem manual do resto).
  const products =
    sort.key === 'destaque'
      ? shown.toSorted((a, b) => Number(b.productType === 'Pack') - Number(a.productType === 'Pack'))
      : shown;

  return (
    <ProductListing
      title={photoBanner?.title ?? collection.title}
      image={bannerImage}
      photo={photoBanner}
      crumbs={crumbs}
      basePath={`/colecoes/${handle}`}
      products={await withPackSavings(products)}
      showType
      sort={sort}
      onlyInStock={onlyInStock}
      facets={facets}
      params={filterParams}
      listName={collection.title}
    />
  );
}
