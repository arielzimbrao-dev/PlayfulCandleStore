import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductGallery from '@/components/ProductGallery/ProductGallery';
import BuyBox from '@/components/BuyBox/BuyBox';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import RelatedProducts from '@/components/RelatedProducts/RelatedProducts';
import BundleOffer from '@/components/BundleOffer/BundleOffer';
import ProductReviews from '@/components/ProductReviews/ProductReviews';
import JsonLd from '@/components/JsonLd/JsonLd';
import TrackProductView from '@/components/TrackProductView/TrackProductView';
import { productLd } from '@/lib/jsonld';
import { productCategory } from '@/lib/filters';
import { getProduct } from '@/lib/shopify';
import { getStock } from '@/lib/shopify/admin';
import { seasonalCollection } from '@/lib/shopify/types';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import './product-page.scss';

export const revalidate = 3600;

// Textos do acordeão por categoria: o queimador é de cerâmica (sem cera nem pavio)
// e wax melts/snapbars não têm chama, por isso cada um tem a sua copy.
const PRODUCT_INFO: Record<string, { about: string; care: string }> = {
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
const DEFAULT_PRODUCT_INFO = PRODUCT_INFO.velas;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return { title: 'Produto não encontrado' };
  const imageUrl = product.featuredImage?.url ?? product.images[0]?.url;
  const description =
    product.seo.description || product.description || `${product.title} — vela artesanal Playful Candles.`;
  return {
    // O seo.title da Shopify já traz "| Playful Candles" — `absolute` evita repetir o sufixo do template.
    title: product.seo.title ? { absolute: product.seo.title } : product.title,
    description: description.slice(0, 155),
    alternates: { canonical: `/produtos/${handle}` },
    openGraph: imageUrl ? { type: 'website', images: [{ url: imageUrl }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const shopifyProduct = await getProduct(handle);
  if (!shopifyProduct) notFound();
  // O estoque vem da Admin API (a Storefront API não o expõe com o nosso token).
  const stockByVariant = await getStock(shopifyProduct.variants.map((variant) => variant.id));
  const product = {
    ...shopifyProduct,
    variants: shopifyProduct.variants.map((variant) => ({ ...variant, quantityAvailable: stockByVariant[variant.id] })),
  };

  const images = product.images.length ? product.images : product.featuredImage ? [product.featuredImage] : [];
  const collection = seasonalCollection(product);
  const reviews = product.reviews ?? [];
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const scents = product.scents ?? [];
  const info = PRODUCT_INFO[productCategory(product) ?? ''] ?? DEFAULT_PRODUCT_INFO;

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
            {product.productType && <p className="eyebrow">{product.productType}</p>}
            <div className="product__title-row">
              <h1 className="script-title">
                <TwoToneTitle text={product.title} />
              </h1>
              {product.weight && <span className="product__weight">{product.weight}</span>}
            </div>
            <div className="product__meta">
              {collection && (
                <Link href={`/colecoes/${collection.handle}`} className="product__collection">
                  {collection.title}
                </Link>
              )}
              <div
                className="product__rating"
                aria-label={reviews.length ? `${averageRating.toFixed(1)} de 5 (${reviews.length})` : 'Sem avaliações'}
              >
                {/* Estrela cheia a partir de x,75 (ex.: 4,8 mostra 5 estrelas). */}
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`fa-star ${averageRating >= star - 0.25 ? 'fa-solid' : 'fa-regular'}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>

            <BuyBox product={product} />

            {(product.descriptionHtml || product.description) && (
              <div className="product__description prose">
                {product.descriptionHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
                ) : (
                  <p>{product.description}</p>
                )}
              </div>
            )}

            <div className="accordion product__accordion">
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

      <BundleOffer product={product} />

      <RelatedProducts product={product} />
    </>
  );
}
