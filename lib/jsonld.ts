import { SITE, abs, sameAs } from './site';
import type { Product } from './shopify/types';

export function organizationLd() {
  const addr = SITE.address;
  const hasAddress = addr.streetAddress || addr.postalCode;
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SITE.url}/#store`,
    name: SITE.name,
    legalName: SITE.legalName,
    taxID: SITE.nif,
    url: SITE.url,
    logo: abs(SITE.logo),
    image: abs(SITE.logo),
    description: SITE.description,
    email: SITE.email || undefined,
    telephone: SITE.telephone || undefined,
    priceRange: '€€',
    currenciesAccepted: SITE.currency,
    areaServed: { '@type': 'Country', name: 'Portugal' },
    address: hasAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: addr.streetAddress || undefined,
          addressLocality: addr.addressLocality,
          addressRegion: addr.addressRegion,
          postalCode: addr.postalCode || undefined,
          addressCountry: addr.addressCountry,
        }
      : {
          '@type': 'PostalAddress',
          addressLocality: addr.addressLocality,
          addressCountry: addr.addressCountry,
        },
    sameAs,
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

export function productLd(product: Product) {
  const price = product.priceRange.minVariantPrice;
  const image = (product.images.length ? product.images : product.featuredImage ? [product.featuredImage] : [])
    .map((i) => i.url)
    .slice(0, 5);
  const reviews = product.reviews ?? [];
  const ratingValue = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.seo.description || product.description,
    image: image.length ? image : [abs(SITE.logo)],
    sku: product.variants[0]?.id,
    brand: { '@type': 'Brand', name: product.vendor || SITE.name },
    // AggregateRating/Review só quando há reviews reais (nunca inventar — risco de penalização Google).
    ...(reviews.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: ratingValue.toFixed(1),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 8).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.author },
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
            reviewBody: r.text || undefined,
            datePublished: r.date || undefined,
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
      // Google recomenda priceValidUntil; sem promo datada, validamos por ~1 ano.
      priceValidUntil: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
      seller: { '@type': 'Organization', name: SITE.name },
      // Só declaramos portes grátis quando o produto sozinho passa o limite (senão o Google recebe
      // um valor falso). Abaixo disso omitimos shippingRate e a tarifa real vem do Merchant Center.
      // ponytail: quando a tabela de portes estiver fechada, passar o valor real em vez de omitir.
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        ...(Number(price.amount) >= SITE.freeShippingThreshold
          ? { shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'EUR' } }
          : {}),
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PT' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          // Expedição em até 24h úteis (o mesmo que a loja promete na barra de apelos e em /envios).
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
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'PT',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        // Dentro do prazo e com o produto por usar, os portes de devolução são por nossa conta.
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
    numberOfItems: items.length, // tem de bater certo com itemListElement (senão aviso de rich-results)
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/produtos/${p.handle}`,
      name: p.title,
    })),
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.url),
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}
