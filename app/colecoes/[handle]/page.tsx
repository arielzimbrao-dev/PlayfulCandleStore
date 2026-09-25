import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ProductListing from '@/components/ProductListing';
import { getCollection } from '@/lib/shopify';
import { resolveSort } from '@/lib/sort';
import { CATEGORIES } from '@/lib/categories';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  if (CATEGORIES[handle]) return {}; // é uma categoria — a página redireciona
  const c = await getCollection(handle, 1);
  if (!c) return { title: 'Coleção não encontrada', robots: { index: false, follow: true } };
  return {
    title: c.seo.title || c.title,
    description: c.seo.description || c.description || `${c.title} — velas artesanais Playful Candles.`,
    alternates: { canonical: `/colecoes/${handle}` },
    openGraph: c.image ? { images: [{ url: c.image.url }] } : undefined,
  };
}

export default async function ColecaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; stock?: string; type?: string; scent?: string; price?: string }>;
}) {
  const { handle } = await params;
  // Handles de categoria/tipo mudaram para /categorias/ — redireciona links antigos.
  if (CATEGORIES[handle]) redirect(`/categorias/${handle}`);

  const sp = await searchParams;
  const sort = resolveSort(sp.sort);
  const stock = sp.stock === '1';
  const facets = { type: sp.type, scent: sp.scent, price: sp.price };
  const params_ = { sort: sort.key, stock: stock ? '1' : undefined, ...facets };

  const collection = await getCollection(handle, 250, { sortKey: sort.collection, reverse: sort.reverse });
  if (!collection) notFound();

  // Banner: usa a imagem da coleção; se não tiver (comum no Shopify), cai numa foto de marca.
  const bannerImage = collection.image ?? { url: '/images/instagram/ig1.jpg', altText: collection.title, width: null, height: null };
  // Breadcrumb curto: "Coleção de Outono" → "Outono".
  const shortTitle = collection.title.replace(/^Cole[çc][ãa]o de\s+/i, '');
  const crumbs = [
    { name: 'Início', url: '/' },
    { name: 'Coleção', url: '/colecoes' },
    { name: shortTitle, url: `/colecoes/${handle}` },
  ];

  return (
    <ProductListing
      eyebrow="Coleção"
      title={collection.title}
      text={collection.description}
      image={bannerImage}
      crumbs={crumbs}
      basePath={`/colecoes/${handle}`}
      products={collection.products}
      showType
      sort={sort}
      stock={stock}
      facets={facets}
      params={params_}
      listName={collection.title}
    />
  );
}
