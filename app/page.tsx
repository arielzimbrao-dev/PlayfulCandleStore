import Hero from '@/components/Hero';
import Appeals from '@/components/Appeals';
import ProductRail from '@/components/ProductRail';
import NovidadesOutono from '@/components/NovidadesOutono';
import SeasonalCollection from '@/components/SeasonalCollection';
import CategoryBento from '@/components/CategoryBento';
import Newsletter from '@/components/Newsletter';
import InstagramFeed from '@/components/InstagramFeed';
import { getProducts } from '@/lib/shopify';

export default async function HomePage() {
  const [best, latest] = await Promise.all([
    getProducts(10, { sortKey: 'BEST_SELLING' }),
    getProducts(12, { sortKey: 'CREATED_AT', reverse: true }),
  ]);

  return (
    <>
      <Hero />
      <Appeals />
      <ProductRail variant="best" products={best.products} />
      {/* ponytail: "Novidades de Outono" e a 2ª fila partilham o pool "latest";
          numa loja com catálogo real não se sobrepõem — reavaliar se ficar repetido. */}
      <NovidadesOutono products={latest.products.slice(0, 6)} />
      <SeasonalCollection />
      <CategoryBento />
      <ProductRail variant="latest" products={latest.products} />
      <Newsletter />
      <InstagramFeed />
    </>
  );
}
