import Hero from '@/components/Hero';
import Appeals from '@/components/Appeals';
import CategoryNav from '@/components/CategoryNav';
import ProductRail from '@/components/ProductRail';
import PackBanner from '@/components/PackBanner';
import CategoryBento from '@/components/CategoryBento';
import { getProducts, getCollection } from '@/lib/shopify';

const AUTUMN = 'colecao-de-outono';

export default async function HomePage() {
  const [autumn, latest] = await Promise.all([
    getCollection(AUTUMN, 12).catch(() => null),
    getProducts(12, { sortKey: 'CREATED_AT', reverse: true }),
  ]);

  return (
    <>
      <Hero />
      <Appeals />
      <CategoryNav />
      <ProductRail variant="autumn" products={autumn?.products ?? []} href={`/colecoes/${AUTUMN}`} />
      <PackBanner />
      <CategoryBento />
      <ProductRail variant="latest" products={latest.products} />
    </>
  );
}
