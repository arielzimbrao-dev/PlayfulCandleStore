import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/ProductGallery';
import AddToCartButton from '@/components/AddToCartButton';
import Breadcrumbs from '@/components/Breadcrumbs';
import LeveJunto from '@/components/LeveJunto';
import ProductReviews from '@/components/ProductReviews';
import JsonLd from '@/components/JsonLd';
import TrackProductView from '@/components/TrackProductView';
import { productLd } from '@/lib/jsonld';
import { productCategory } from '@/lib/filters';
import { getProduct } from '@/lib/shopify';
import { seasonalCollection } from '@/lib/shopify/types';
import Link from 'next/link';

export const revalidate = 3600;

// Copy do acordeão por tipo: o queimador é cerâmica (não tem cera nem pavio) e melts/snapbars não têm chama.
const INFO: Record<string, { about: string; care: string }> = {
  velas: {
    about:
      'Vela de copo artesanal, feita à mão em Lisboa com cera 100% vegetal e fragrância premium de longa duração. O copo é reutilizável depois de acabar.',
    care: 'Acende sempre com supervisão, longe de materiais inflamáveis, crianças e animais. Apara o pavio a ~5 mm antes de cada utilização e não queimes mais de 4 horas seguidas.',
  },
  wax: {
    about:
      'Wax melts artesanais, feitos à mão em Lisboa com cera 100% vegetal. Sem chama nem pavio: derretem no queimador e libertam o aroma na divisão.',
    care: 'Usa num queimador próprio, numa superfície estável e resistente ao calor, longe de crianças e animais. Se o teu queimador for de vela, nunca o deixes aceso sem vigilância. Retira a cera com o queimador já frio.',
  },
  snap: {
    about:
      'Snapbar artesanal em cera 100% vegetal, feita à mão em Lisboa. Parte os cubos que quiseres e derrete-os no queimador, sem chama nem pavio.',
    care: 'Usa num queimador próprio, numa superfície estável e resistente ao calor, longe de crianças e animais. Se o teu queimador for de vela, nunca o deixes aceso sem vigilância. Retira a cera com o queimador já frio.',
  },
  burner: {
    about:
      'Queimador em cerâmica, feito para wax melts e snapbars. Peça decorativa e funcional, para deixar à vista em qualquer canto da casa.',
    care: 'Coloca numa superfície estável e resistente ao calor, longe de crianças e animais. Nunca deixes uma vela acesa sem vigilância. Deixa arrefecer por completo antes de limpar e retira a cera já sólida.',
  },
  pack: {
    about: 'Pack artesanal feito à mão em Lisboa, com cera 100% vegetal e fragrâncias premium, pronto a oferecer.',
    care: 'Segue as indicações de cada produto do pack. Usa sempre com supervisão, longe de materiais inflamáveis, crianças e animais.',
  },
};
const DEFAULT_INFO = INFO.velas;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const p = await getProduct(handle);
  if (!p) return { title: 'Produto não encontrado' };
  const img = p.featuredImage?.url ?? p.images[0]?.url;
  return {
    title: p.seo.title || p.title,
    description: (p.seo.description || p.description || `${p.title} — vela artesanal Playful Candles.`).slice(0, 155),
    alternates: { canonical: `/produtos/${handle}` },
    openGraph: img ? { type: 'website', images: [{ url: img }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  const images = product.images.length ? product.images : product.featuredImage ? [product.featuredImage] : [];
  const coll = seasonalCollection(product);
  const reviews = product.reviews ?? [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const scents = product.scents ?? [];
  const info = INFO[productCategory(product) ?? ''] ?? DEFAULT_INFO;

  return (
    <>
      <JsonLd data={productLd(product)} />
      <TrackProductView
        id={product.id}
        name={product.title}
        price={Number(product.priceRange.minVariantPrice.amount)}
        category={product.productType}
      />
      <section className="container product">
        <Breadcrumbs
          items={[
            { name: 'Início', url: '/' },
            { name: 'Loja', url: '/produtos' },
            { name: product.title, url: `/produtos/${handle}` },
          ]}
        />
        <div className="product__grid">
          <ProductGallery images={images} title={product.title} handle={product.handle} />
          <div className="product__info">
            <div className="product__rating" aria-label={reviews.length ? `${avg.toFixed(1)} de 5 (${reviews.length})` : 'Sem avaliações'}>
              {[1, 2, 3, 4, 5].map((n) => (
                <i key={n} className={`fa-star ${avg >= n - 0.25 ? 'fa-solid' : 'fa-regular'}`} aria-hidden="true" />
              ))}
            </div>
            {product.productType && <p className="eyebrow">{product.productType}</p>}
            <div className="product__title-row">
              <h1 className="script-title script-title--pink">{product.title}</h1>
              {product.weight && <span className="product__weight">{product.weight}</span>}
            </div>
            {coll && (
              <Link href={`/colecoes/${coll.handle}`} className="product__coll">
                {coll.title}
              </Link>
            )}

            <AddToCartButton product={product} />

            {(product.descriptionHtml || product.description) && (
              <div className="product__desc prose">
                {product.descriptionHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
                ) : (
                  <p>{product.description}</p>
                )}
              </div>
            )}

            <div className="faq product__acc">
              <details open>
                <summary>Informações do produto</summary>
                <p>
                  {info.about}
                  {product.weight ? ` Peso: ${product.weight}.` : ''}
                </p>
              </details>
              {scents.length > 0 && (
                <details>
                  <summary>Aromas e notas olfativas</summary>
                  <p>Notas: {scents.join(', ')}.</p>
                </details>
              )}
              <details>
                <summary>Cuidados de utilização</summary>
                <p>{info.care}</p>
              </details>
            </div>
          </div>
        </div>
      </section>

      <ProductReviews productId={product.id} reviews={reviews} />

      <LeveJunto product={product} />
    </>
  );
}
