import { SITE, absoluteUrl, SOCIAL_PROFILE_URLS } from './site';
import type { Product } from './shopify/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function organizationLd() {
  const address = SITE.address;
  const hasAddress = address.streetAddress || address.postalCode;
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
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
    priceRange: '€€',
    currenciesAccepted: SITE.currency,
    areaServed: { '@type': 'Country', name: 'Portugal' },
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

// transitDays: prazo de entrega em Portugal, lido da tarifa na Shopify (getShippingZones). Sem ele,
// o transitTime é omitido.
export function productLd(product: Product, transitDays?: { min: number; max: number } | null) {
  const price = product.priceRange.minVariantPrice;
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.seo.description || product.description,
    image: imageUrls.length ? imageUrls : [absoluteUrl(SITE.logo)],
    sku: product.variants[0]?.id,
    brand: { '@type': 'Brand', name: product.vendor || SITE.name },
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
    offers: {
      '@type': 'Offer',
      url: `${SITE.url}/produtos/${product.handle}`,
      priceCurrency: price.currencyCode,
      price: Number(price.amount).toFixed(2),
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      // O Google recomenda priceValidUntil; sem promoção com data, damos validade de ~1 ano.
      priceValidUntil: new Date(Date.now() + 365 * DAY_MS).toISOString().slice(0, 10),
      seller: { '@type': 'Organization', name: SITE.name },
      // Sem shippingRate: os portes dependem do peso da encomenda (tarifas na Shopify) e o Google
      // recebe o valor real pelo Merchant Center.
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PT' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          // Envio em até 24h úteis (o mesmo que a loja promete na barra de apelos e em /envios).
          // businessDays: o Google só conta seg-sex ao estimar a data de entrega.
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
            businessDays: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: [
                'https://schema.org/Monday',
                'https://schema.org/Tuesday',
                'https://schema.org/Wednesday',
                'https://schema.org/Thursday',
                'https://schema.org/Friday',
              ],
            },
          },
          ...(transitDays
            ? { transitTime: { '@type': 'QuantitativeValue', minValue: transitDays.min, maxValue: transitDays.max, unitCode: 'DAY' } }
            : {}),
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'PT',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        // Dentro do prazo e com o produto sem uso, o frete de devolução é por nossa conta.
        returnFees: 'https://schema.org/FreeReturn',
      },
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
