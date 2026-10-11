import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ProductListing from '@/components/ProductListing/ProductListing';
import { getCollection } from '@/lib/shopify';
import { resolveSort } from '@/lib/sort';
import { CATEGORIES } from '@/lib/categories';

export const revalidate = 3600;

// Banners-arte por coleção (com o texto embutido na imagem).
// ponytail: mapa fixo; passar para um metafield se crescer.
const ART_BANNERS: Record<string, { src: string; alt: string; width: number; height: number }> = {
  'colecao-de-outono': {
    src: '/images/hero-colecao-outono.png',
    alt: 'Trio Outono — três novas sugestões para um outono três vezes mais aconchegante. Velas Pumpkin Spice e Cappuccino entre pinhas e folhas.',
    width: 1270,
    height: 330,
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
    openGraph: collection.image ? { images: [{ url: collection.image.url }] } : undefined,
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

  return (
    <ProductListing
      title={collection.title}
      image={bannerImage}
      art={ART_BANNERS[handle]}
      crumbs={crumbs}
      basePath={`/colecoes/${handle}`}
      products={collection.products}
      showType
      sort={sort}
      onlyInStock={onlyInStock}
      facets={facets}
      params={filterParams}
      listName={collection.title}
    />
  );
}
