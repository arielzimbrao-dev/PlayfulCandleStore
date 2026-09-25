import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductListing from '@/components/ProductListing';
import { getProducts } from '@/lib/shopify';
import { resolveSort } from '@/lib/sort';
import { CATEGORIES } from '@/lib/categories';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const info = CATEGORIES[handle];
  if (!info) return { title: 'Categoria não encontrada', robots: { index: false, follow: true } };
  const has = (await getProducts(1, { query: info.query })).products.length > 0;
  return {
    title: info.title,
    description: info.text,
    alternates: { canonical: `/categorias/${handle}` },
    robots: { index: has, follow: true },
  };
}

export default async function CategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; stock?: string; type?: string; scent?: string; price?: string }>;
}) {
  const { handle } = await params;
  const info = CATEGORIES[handle];
  if (!info) notFound();

  const sp = await searchParams;
  const sort = resolveSort(sp.sort);
  const stock = sp.stock === '1';
  const facets = { type: sp.type, scent: sp.scent, price: sp.price };
  const params_ = { sort: sort.key, stock: stock ? '1' : undefined, ...facets };
  const crumbs = [
    { name: 'Início', url: '/' },
    { name: info.title, url: `/categorias/${handle}` },
  ];

  const all = (await getProducts(250, { query: info.query, sortKey: sort.product, reverse: sort.reverse })).products;

  if (all.length === 0) {
    return (
      <section className="container" style={{ textAlign: 'center', minHeight: '44vh' }}>
        <Breadcrumbs items={crumbs} />
        <p className="eyebrow">Em breve</p>
        <h1>{info.title}</h1>
        <p className="lead" style={{ maxWidth: '46ch', margin: '1rem auto 1.5rem', color: 'var(--ink-soft)' }}>
          Esta categoria está a chegar em breve. 🕯️ Entretanto, dá uma vista de olhos no resto da loja.
        </p>
        <Link className="btn btn--primary" href="/produtos">Ver a loja</Link>
      </section>
    );
  }

  return (
    <ProductListing
      eyebrow="Categoria"
      title={info.title}
      text={info.text}
      image={{ url: info.image, altText: info.title, width: null, height: null }}
      crumbs={crumbs}
      basePath={`/categorias/${handle}`}
      products={all}
      showType={false}
      sort={sort}
      stock={stock}
      facets={facets}
      params={params_}
      listName={info.title}
    />
  );
}
