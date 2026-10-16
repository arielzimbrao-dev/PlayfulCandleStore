import { OG_BASE } from '@/lib/site';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductGallery from '@/components/ProductGallery/ProductGallery';
import BuyBox from '@/components/BuyBox/BuyBox';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import RelatedProducts from '@/components/RelatedProducts/RelatedProducts';
import BundleOffer from '@/components/BundleOffer/BundleOffer';
import HowToUse from '@/components/HowToUse/HowToUse';
import ProductReviews from '@/components/ProductReviews/ProductReviews';
import JsonLd from '@/components/JsonLd/JsonLd';
import TrackProductView from '@/components/TrackProductView/TrackProductView';
import { productLd } from '@/lib/jsonld';
import { productCategory } from '@/lib/filters';
import { getBundleComponents, getProduct, getProducts } from '@/lib/shopify';
import { getShippingZones, getVariantStock } from '@/lib/shopify/admin';
import { getPackOptions, slotKeys } from '@/lib/packs';
import { getSeasonalCollection } from '@/lib/shopify/types';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import GoogleRating from '@/components/GoogleRating/GoogleRating';
import { shippingFrom } from '@/components/ShippingNote/ShippingNote';
import { withPackSavings } from '@/lib/bundle';
import { CATEGORIES } from '@/lib/categories';
import { PackChoiceProvider } from '@/components/PackPicker/PackChoice';
import PackDetails, { type PackDetailSlot } from '@/components/PackPicker/PackDetails';
import type { Product } from '@/lib/shopify/types';
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

// Produtos com nome parecido mas aroma diferente: aviso por baixo da descrição, com link para o outro.
const SCENT_NOTES: Record<string, { text: string; href: string; link: string }> = {
  'cappuccino-break': {
    text: 'O aroma da snapbar Cappuccino Break é diferente do da vela Cappuccino.',
    href: '/produtos/cappuccino',
    link: 'Ver a vela Cappuccino',
  },
  cappuccino: {
    text: 'O aroma da vela Cappuccino é diferente do da snapbar Cappuccino Break.',
    href: '/produtos/cappuccino-break',
    link: 'Ver a snapbar Cappuccino Break',
  },
};

const CARE_LABELS: Record<string, string> = { velas: 'Velas', wax: 'Wax melts', snap: 'Snapbars', burner: 'Queimador' };

// Pack: produtos fixos (bundle nativo), itens de escolha com as notas de cada opção, e os
// cuidados de cada tipo que o pack traz (tipos com o mesmo texto juntam-se numa linha).
async function getPackDetails(product: Product, slots: { key: string; options: { handle: string }[] }[] | undefined) {
  const [catalog, bundleHandles] = await Promise.all([
    getProducts(100).then((page) => page.products),
    slots ? [] : getBundleComponents(product.handle).catch(() => []),
  ]);
  const byHandle = new Map(catalog.map((item) => [item.handle, item]));
  const detail = (item: Product) => ({ title: item.title, scents: item.scents ?? [] });
  const fixedProducts = bundleHandles.flatMap((handle) => byHandle.get(handle) ?? []);
  const packSlots: PackDetailSlot[] = (slots ?? []).map((slot) => ({
    key: slot.key,
    options: Object.fromEntries(
      slot.options.flatMap((option) => {
        const item = byHandle.get(option.handle);
        return item ? [[option.handle, detail(item)]] : [];
      }),
    ),
  }));
  const types = [
    ...new Set([...fixedProducts.map((item) => productCategory(item)), ...product.packSlots.map((slot) => slot.type)]),
  ].filter((type): type is NonNullable<typeof type> => !!type && !!PRODUCT_INFO[type]);
  const care: { label: string; text: string }[] = [];
  for (const type of types) {
    const text = PRODUCT_INFO[type].care;
    const same = care.find((entry) => entry.text === text);
    if (same) same.label += ` e ${CARE_LABELS[type].toLowerCase()}`;
    else care.push({ label: CARE_LABELS[type], text });
  }
  return { fixed: fixedProducts.map(detail), slots: packSlots, care };
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return { title: 'Produto não encontrado', robots: { index: false, follow: true } };
  const imageUrl = product.featuredImage?.url ?? product.images[0]?.url;
  const description =
    product.seo.description || product.description || `${product.title} — vela artesanal Playful Candles.`;
  return {
    // O seo.title da Shopify já traz "| Playful Candles" — `absolute` evita repetir o sufixo do template.
    title: product.seo.title ? { absolute: product.seo.title } : product.title,
    // ≤155 car., cortado no último espaço (não a meio da palavra).
    description: description.length > 155 ? `${description.slice(0, description.lastIndexOf(' ', 154))}…` : description,
    alternates: { canonical: `/produtos/${handle}` },
    openGraph: imageUrl ? { ...OG_BASE, images: [{ url: imageUrl }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const shopifyProduct = await getProduct(handle);
  if (!shopifyProduct) notFound();
  // O estoque vem da Admin API (a Storefront API não o expõe com o nosso token).
  const [stockByVariant, shippingZones, packOptions, [withSavings]] = await Promise.all([
    getVariantStock(shopifyProduct.variants.map((variant) => variant.id)),
    getShippingZones(),
    shopifyProduct.packSlots.length ? getPackOptions(shopifyProduct.packSlots) : null,
    withPackSavings([shopifyProduct]),
  ]);
  // Pack de escolha: um seletor por item na BuyBox.
  const pack = packOptions
    ? slotKeys(shopifyProduct.packSlots).map((key, index) => ({ key, options: packOptions[index] }))
    : undefined;
  const product = {
    ...withSavings,
    variants: shopifyProduct.variants.map((variant) => ({ ...variant, quantityAvailable: stockByVariant[variant.id] })),
  };

  const images = product.images.length ? product.images : product.featuredImage ? [product.featuredImage] : [];
  const collection = getSeasonalCollection(product);
  const reviews = product.reviews ?? [];
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const scents = product.scents ?? [];
  const category = productCategory(product);
  const info = PRODUCT_INFO[category ?? ''] ?? DEFAULT_PRODUCT_INFO;
  // Breadcrumb: Início › categoria do tipo (ou a coleção, ou a Loja) › produto.
  const categoryHandle = Object.keys(CATEGORIES).find((key) => CATEGORIES[key].type === category);
  const parentCrumb = categoryHandle
    ? { name: CATEGORIES[categoryHandle].title, url: `/categorias/${categoryHandle}` }
    : collection
      ? { name: collection.title, url: `/colecoes/${collection.handle}` }
      : { name: 'Loja', url: '/produtos' };
  const packDetails = category === 'pack' ? await getPackDetails(product, pack).catch(() => null) : null;

  return (
    <>
      <JsonLd data={productLd(product, shippingZones)} />
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
            parentCrumb,
            { name: product.title, url: `/produtos/${handle}` },
          ]}
        />
        <div className="product__grid">
          {/* Nome antes da galeria: no celular fica em cima da foto; no desktop a grade
              devolve-o à coluna da direita (ver grid-template-areas em product-page.scss). */}
          <div className="product__head">
            {product.productType && <p className="eyebrow">{product.productType}</p>}
            <div className="product__title-row">
              <h1 className="script-title">
                <TwoToneTitle text={product.title} />
              </h1>
              {product.weight && <span className="product__weight">{product.weight}</span>}
            </div>
          </div>
          <ProductGallery images={images} title={product.title} handle={product.handle} />
          <div className="product__info">
            <PackChoiceProvider>
              <div className="product__meta">
                {collection && (
                  <Link href={`/colecoes/${collection.handle}`} className="product__collection">
                    {collection.title}
                  </Link>
                )}
                {/* Sem avaliações do produto: estrelas vazias seriam prova social negativa —
                    mostra antes o selo da ficha Google da loja. */}
                {reviews.length ? (
                  <div className="product__rating" role="img" aria-label={`${averageRating.toFixed(1)} de 5 (${reviews.length})`}>
                    {/* Estrela cheia a partir de x,75 (ex.: 4,8 mostra 5 estrelas). */}
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`fa-star ${averageRating >= star - 0.25 ? 'fa-solid' : 'fa-regular'}`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                ) : (
                  <GoogleRating />
                )}
              </div>

              <BuyBox product={product} pack={pack} shippingFrom={shippingFrom(shippingZones)} />

              {(product.descriptionHtml || product.description) && (
                <div className="product__description prose">
                  {product.descriptionHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
                  ) : (
                    <p>{product.description}</p>
                  )}
                </div>
              )}

              {SCENT_NOTES[handle] && (
                <p className="product__scent-note">
                  <i className="fa-solid fa-circle-info" aria-hidden="true" /> {SCENT_NOTES[handle].text}{' '}
                  <Link href={SCENT_NOTES[handle].href}>{SCENT_NOTES[handle].link}</Link>
                </p>
              )}

              <div className="accordion product__accordion">
                <details open>
                  <summary>Informações do produto</summary>
                  <p>
                    {info.about}
                    {product.weight ? ` Peso: ${product.weight}.` : ''}
                  </p>
                </details>
                {packDetails?.care.length ? (
                  <PackDetails {...packDetails} />
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </PackChoiceProvider>
          </div>
        </div>
      </section>

      {/* Wax melts e snapbars: "Como usar" logo abaixo da informação do produto. */}
      {(category === 'wax' || category === 'snap') && <HowToUse />}

      <BundleOffer product={product} />

      <ProductReviews productId={product.id} reviews={reviews} />

      <RelatedProducts product={product} />
    </>
  );
}
