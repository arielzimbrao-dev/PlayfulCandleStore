export type Money = { amount: string; currencyCode: string };

export type Image = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type Seo = { title: string | null; description: string | null };

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: { name: string; value: string }[];
};

export type Review = {
  author: string;
  rating: number; // 1..5
  text: string;
  date?: string; // ISO
  verified?: boolean;
  approved?: boolean; // moderação: só aprovadas aparecem
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  vendor: string;
  availableForSale: boolean;
  scents: string[]; // metafield custom.scent (lista) já parseado
  weight: string; // metafield custom.peso (ex.: "150g"); fallback por tipo. '' se desconhecido
  reviews: Review[]; // metafield custom.reviews (JSON) já parseado (só aprovadas)
  collections: { title: string; handle: string }[];
  seo: Seo;
  featuredImage: Image | null;
  images: Image[];
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  compareAtPriceRange: { minVariantPrice: Money } | null;
  variants: ProductVariant[];
};

export type PageInfo = { hasNextPage: boolean; endCursor: string | null };
export type ProductsPage = { products: Product[]; pageInfo: PageInfo };

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  seo: Seo;
  image: Image | null;
  products: Product[];
};

export type CollectionSummary = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: Image | null;
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: Money };
  merchandise: {
    id: string;
    title: string;
    price: Money;
    product: { id: string; handle: string; title: string; featuredImage: Image | null };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  note: string | null;
  discountCodes: { code: string; applicable: boolean }[];
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: CartLine[];
  /** Avisos da última mutação (ex.: quantidade reduzida ao stock). Não vem do objeto Cart da Shopify. */
  warnings?: { code: string; message: string }[];
};

// Resultado do dropdown de pesquisa (subconjunto de Product).
export type SearchHit = {
  id: string;
  handle: string;
  title: string;
  featuredImage: Image | null;
  priceRange: { minVariantPrice: Money };
};

export type CartLineInput = { merchandiseId: string; quantity: number };
export type CartLineUpdateInput = { id: string; quantity: number };

// Handles que representam TIPOS de produto (não coleções curadas/sazonais).
export const TYPE_HANDLES = ['velas-de-copo', 'wax-melts', 'snapbars', 'queimadores'] as const;

// Primeira coleção curada/sazonal a que o produto pertence (ignora os 4 tipos). null se nenhuma.
export function seasonalCollection(product: Product): { title: string; handle: string } | null {
  return product.collections?.find((c) => !TYPE_HANDLES.includes(c.handle as (typeof TYPE_HANDLES)[number])) ?? null;
}
