import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import ProductListing from '@/components/ProductListing/ProductListing';
import { getProducts } from '@/lib/shopify';
import { resolveSort } from '@/lib/sort';
import { CATEGORIES, categoryBanner } from '@/lib/categories';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const info = CATEGORIES[handle];
  if (!info) return { title: 'Categoria não encontrada', robots: { index: false, follow: true } };
  // Categoria ainda sem produtos não deve ser indexada (mostra só "Em breve").
  const hasProducts = (await getProducts(1, { query: info.query })).products.length > 0;
  return {
    title: info.title,
    description: info.text,
    alternates: { canonical: `/categorias/${handle}` },
    robots: { index: hasProducts, follow: true },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; stock?: string; type?: string; scent?: string; price?: string }>;
}) {
  const { handle } = await params;
  const info = CATEGORIES[handle];
  if (!info) notFound();

  const query = await searchParams;
  const sort = resolveSort(query.sort);
  const onlyInStock = query.stock === '1';
  const facets = { type: query.type, scent: query.scent, price: query.price };
  const filterParams = { sort: sort.key, stock: onlyInStock ? '1' : undefined, ...facets };
  const crumbs = [
    { name: 'Início', url: '/' },
    { name: info.title, url: `/categorias/${handle}` },
  ];

  const { products } = await getProducts(250, { query: info.query, sortKey: sort.product, reverse: sort.reverse });

  if (products.length === 0) {
    return (
      <section className="container status-page">
        <Breadcrumbs items={crumbs} />
        <p className="eyebrow">Em breve</p>
        <h1>{info.title}</h1>
        <p className="status-page__text">
          Esta categoria está a chegar em breve. 🕯️ Entretanto, dá uma vista de olhos no resto da loja.
        </p>
        <Link className="btn btn--primary" href="/produtos">Ver a loja</Link>
      </section>
    );
  }

  return (
    <ProductListing
      title={info.title}
      photo={{ ...categoryBanner(handle), alt: `${info.title} artesanais Playful Candles`, text: info.text }}
      crumbs={crumbs}
      basePath={`/categorias/${handle}`}
      products={products}
      showType={false}
      sort={sort}
      onlyInStock={onlyInStock}
      facets={facets}
      params={filterParams}
      listName={info.title}
    />
  );
}
