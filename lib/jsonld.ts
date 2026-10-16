import { SITE, absoluteUrl, SOCIAL_PROFILE_URLS } from './site';
import type { Product } from './shopify/types';
import type { ShippingZone } from './shopify/admin';

const DAY_MS = 24 * 60 * 60 * 1000;

export function organizationLd() {
  const address = SITE.address;
  const hasAddress = address.streetAddress || address.postalCode;
  return {
    '@context': 'https://schema.org',
    // Loja só online: OnlineStore (sem priceRange/currenciesAccepted, que são de loja física).
    '@type': 'OnlineStore',
    '@id': `${SITE.url}/#store`,
    name: SITE.name,
    legalName: SITE.legalName,
    taxID: SITE.nif,
    url: SITE.url,
    logo: absoluteUrl(SITE.logo),
    image: absoluteUrl(SITE.logo),
    description: SITE.description,
    email: SITE.email || undefined,
    telephone: SITE.telephone || undefined,
    areaServed: [
      { '@type': 'Country', name: 'Portugal' },
      { '@type': 'Country', name: 'Espanha' },
    ],
    address: hasAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: address.streetAddress || undefined,
          addressLocality: address.addressLocality,
          addressRegion: address.addressRegion,
          postalCode: address.postalCode || undefined,
          addressCountry: address.addressCountry,
        }
      : {
          '@type': 'PostalAddress',
          addressLocality: address.addressLocality,
          addressCountry: address.addressCountry,
        },
    sameAs: SOCIAL_PROFILE_URLS,
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'pt-PT',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/pesquisa?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

const BUSINESS_DAYS = {
  '@type': 'OpeningHoursSpecification',
  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => `https://schema.org/${day}`),
};

// Um OfferShippingDetails por país de cada zona de envio da Shopify (getShippingZones): tarifa e
// prazo de trânsito vêm de lá. Sem zonas (Admin API fora do ar), o shippingDetails é omitido.
function shippingDetailsLd(zones: ShippingZone[], currency: string) {
  return zones.flatMap((zone) =>
    zone.countries.map((country) => ({
      '@type': 'OfferShippingDetails',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: country },
      // ponytail: tarifa do 1.º escalão de peso (0–1 kg) — cobre uma peça; encomendas maiores
      // pagam por escalão no checkout. Passar o peso da variante se houver produtos > 1 kg.
      ...(zone.rates[0]
        ? { shippingRate: { '@type': 'MonetaryAmount', value: zone.rates[0].price.toFixed(2), currency } }
        : {}),
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        // Expedição em até 24h úteis — a promessa da barra de apelos e de /envios (a Shopify não
        // expõe o tempo de preparação na API). businessDays: o Google só conta seg-sex.
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY', businessDays: BUSINESS_DAYS },
        ...(zone.days
          ? {
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: zone.days.min,
                maxValue: zone.days.max,
                unitCode: 'DAY',
                businessDays: BUSINESS_DAYS,
              },
            }
          : {}),
      },
    })),
  );
}

export function productLd(product: Product, shippingZones: ShippingZone[] = []) {
  const { minVariantPrice: minPrice, maxVariantPrice: maxPrice } = product.priceRange;
  const sourceImages = product.images.length
    ? product.images
    : product.featuredImage
      ? [product.featuredImage]
      : [];
  const imageUrls = sourceImages.map((image) => image.url).slice(0, 5);
  const reviews = product.reviews ?? [];
  const ratingValue = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const shippingDetails = shippingDetailsLd(shippingZones, minPrice.currencyCode);
  const countries = [...new Set(shippingZones.flatMap((zone) => zone.countries))];
  const samePrice = Number(minPrice.amount) === Number(maxPrice.amount);
  const offerBase = {
    url: `${SITE.url}/produtos/${product.handle}`,
    priceCurrency: minPrice.currencyCode,
    availability: product.availableForSale
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: SITE.name },
    ...(shippingDetails.length ? { shippingDetails } : {}),
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: countries.length ? countries : ['PT', 'ES'],
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      // Dentro do prazo e com o produto sem uso, o frete de devolução é por nossa conta.
      returnFees: 'https://schema.org/FreeReturn',
    },
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.seo.description || product.description,
    image: imageUrls.length ? imageUrls : [absoluteUrl(SITE.logo)],
    // SKU real da variante (nunca o GID da Shopify); vazio → omitido.
    sku: product.variants[0]?.sku || undefined,
    brand: { '@type': 'Brand', name: SITE.name },
    // AggregateRating/Review só quando há avaliações reais (nunca inventar — risco de penalização
    // do Google).
    ...(reviews.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: ratingValue.toFixed(1),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 8).map((review) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: review.author },
            reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5 },
            reviewBody: review.text || undefined,
            datePublished: review.date || undefined,
          })),
        }
      : {}),
    // Variantes com preços diferentes → AggregateOffer (intervalo de preços).
    offers: samePrice
      ? {
          '@type': 'Offer',
          ...offerBase,
          price: Number(minPrice.amount).toFixed(2),
          // O Google recomenda priceValidUntil; sem promoção com data, damos validade de ~1 ano.
          priceValidUntil: new Date(Date.now() + 365 * DAY_MS).toISOString().slice(0, 10),
        }
      : {
          '@type': 'AggregateOffer',
          ...offerBase,
          lowPrice: Number(minPrice.amount).toFixed(2),
          highPrice: Number(maxPrice.amount).toFixed(2),
          offerCount: product.variants.length,
        },
  };
}

export function itemListLd(products: Pick<Product, 'title' | 'handle'>[], name?: string) {
  const items = products.slice(0, 30);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    // Tem de bater com itemListElement (senão o teste de rich results dá aviso).
    numberOfItems: items.length,
    itemListElement: items.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE.url}/produtos/${product.handle}`,
      name: product.title,
    })),
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.url),
    })),
  };
}

export function faqLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}
