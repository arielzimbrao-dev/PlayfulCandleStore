const PRODUCT_FRAGMENT = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    productType
    tags
    vendor
    availableForSale
    scent: metafield(namespace: "custom", key: "aromas") {
      value
    }
    peso: metafield(namespace: "custom", key: "peso") {
      value
    }
    reviews: metafield(namespace: "custom", key: "reviews") {
      value
    }
    collections(first: 5) {
      nodes {
        title
        handle
      }
    }
    seo {
      title
      description
    }
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 10) {
      nodes {
        url
        altText
        width
        height
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    note
    discountCodes {
      code
      applicable
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            price {
              amount
              currencyCode
            }
            product {
              id
              handle
              title
              featuredImage {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  }
`;

// @inContext(country: PT) → preços/mercado corretos para Portugal (EUR).
export const PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query Products($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String)
  @inContext(country: PT) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
      nodes {
        ...ProductFields
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query ProductByHandle($handle: String!) @inContext(country: PT) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
`;

export const PRODUCT_RECOMMENDATIONS_QUERY = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query ProductRecommendations($productHandle: String!, $intent: ProductRecommendationIntent) @inContext(country: PT) {
    productRecommendations(productHandle: $productHandle, intent: $intent) {
      ...ProductFields
    }
  }
`;

export const COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query CollectionByHandle($handle: String!, $first: Int!, $sortKey: ProductCollectionSortKeys, $reverse: Boolean)
  @inContext(country: PT) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        title
        description
      }
      image {
        url
        altText
        width
        height
      }
      products(first: $first, sortKey: $sortKey, reverse: $reverse) {
        nodes {
          ...ProductFields
        }
      }
    }
  }
`;

export const COLLECTIONS_QUERY = /* GraphQL */ `
  query Collections($first: Int!) {
    collections(first: $first, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        description
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
`;

export const CART_QUERY = /* GraphQL */ `
  ${CART_FRAGMENT}
  query Cart($id: ID!) @inContext(country: PT) {
    cart(id: $id) {
      ...CartFields
    }
  }
`;

// Dropdown do header: a predictiveSearch tolera erros de escrita e pesquisa também por aroma/tag,
// ao contrário da query de produtos. Campos mínimos — o dropdown só mostra foto, nome e preço.
export const PREDICTIVE_SEARCH_QUERY = /* GraphQL */ `
  query PredictiveSearch($q: String!, $limit: Int!) @inContext(country: PT) {
    predictiveSearch(query: $q, limit: $limit, types: [PRODUCT]) {
      products {
        id
        handle
        title
        featuredImage {
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;
