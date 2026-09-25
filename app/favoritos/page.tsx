import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import FavoritesList from '@/components/FavoritesList';
import { getProducts } from '@/lib/shopify';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Os teus favoritos',
  description: 'Os produtos Playful Candles que guardaste como favoritos.',
  alternates: { canonical: '/favoritos' },
  robots: { index: false, follow: true }, // página pessoal (por sessão) — não indexar
};

export default async function FavoritosPage() {
  const { products } = await getProducts(250);
  return (
    <section className="container">
      <Breadcrumbs items={[{ name: 'Início', url: '/' }, { name: 'Favoritos', url: '/favoritos' }]} />
      <div className="sec__head">
        <div>
          <h1>Os teus favoritos</h1>
        </div>
      </div>
      <FavoritesList products={products} />
    </section>
  );
}
