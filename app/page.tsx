import type { Metadata } from 'next';
import Hero from '@/components/Hero/Hero';
import Appeals from '@/components/Appeals/Appeals';
import CategoryNav from '@/components/CategoryNav/CategoryNav';
import ProductRail from '@/components/ProductRail/ProductRail';
import PackBanner from '@/components/PackBanner/PackBanner';
import ScentGrid from '@/components/ScentGrid/ScentGrid';
import HowToUse from '@/components/HowToUse/HowToUse';
import Testimonials from '@/components/Testimonials/Testimonials';
import { getProducts, getCollection } from '@/lib/shopify';
import { withPackSavings } from '@/lib/bundle';

const AUTUMN_COLLECTION = 'colecao-de-outono';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
};

export default async function HomePage() {
  const [autumnCollection, newArrivals] = await Promise.all([
    getCollection(AUTUMN_COLLECTION, 12).catch(() => null),
    getProducts(12, { sortKey: 'CREATED_AT', reverse: true }),
  ]);

  return (
    <>
      <Hero />
      <Appeals />
      <CategoryNav />
      <ProductRail
        variant="autumn"
        products={await withPackSavings(autumnCollection?.products ?? [])}
        href={`/colecoes/${AUTUMN_COLLECTION}`}
      />
      <PackBanner />
      <ScentGrid />
      <ProductRail variant="latest" products={await withPackSavings(newArrivals.products)} />
      <HowToUse />
      <Testimonials />
      {/* ponytail: CustomerReviews fora até haver avaliações reais; voltar a pôr aqui depois. */}
    </>
  );
}
