import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import FavoritesList from '@/components/FavoritesList/FavoritesList';
import { getProducts } from '@/lib/shopify';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Os teus favoritos',
  description: 'Os produtos Playful Candles que guardaste como favoritos.',
  alternates: { canonical: '/favoritos' },
  robots: { index: false, follow: true }, // página pessoal (por sessão) — não indexar
};

// Os favoritos ficam no localStorage (cliente): o servidor manda o catálogo e o FavoritesList filtra.
export default async function FavoritesPage() {
  const { products } = await getProducts(250);
  return (
    <section className="container">
      <Breadcrumbs items={[{ name: 'Início', url: '/' }, { name: 'Favoritos', url: '/favoritos' }]} />
      <div className="section__head">
        <h1 className="script-title script-title--compact">
          <TwoToneTitle text="Os teus favoritos" /> <span className="script-spark" aria-hidden="true" />
        </h1>
      </div>
      <FavoritesList products={products} />
    </section>
  );
}
