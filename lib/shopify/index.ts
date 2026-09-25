import { shopifyFetch } from './client';
import { relatedProducts, productCategory } from '../filters';
import {
  COLLECTION_BY_HANDLE_QUERY,
  COLLECTIONS_QUERY,
  CART_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_RECOMMENDATIONS_QUERY,
  PREDICTIVE_SEARCH_QUERY,
} from './queries';
import {
  CART_CREATE,
  CART_DISCOUNT_CODES_UPDATE,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
  CART_NOTE_UPDATE,
} from './mutations';
import type {
  Cart,
  CartLine,
  CartLineInput,
  CartLineUpdateInput,
  Collection,
  CollectionSummary,
  Image,
  PageInfo,
  Product,
  ProductVariant,
  ProductsPage,
  SearchHit,
} from './types';

const REVALIDATE = 60 * 60; // 1h ISR for storefront reads

// A API retorna conexoes { nodes: [] }; achatamos para arrays simples.
type Connection<T> = { nodes: T[] };
type RawProduct = Omit<Product, 'images' | 'variants' | 'collections' | 'scents' | 'weight' | 'reviews'> & {
  images: Connection<Image>;
  variants: Connection<ProductVariant>;
  collections: Connection<{ title: string; handle: string }>;
  scent: { value: string } | null;
  peso: { value: string } | null;
  reviews: { value: string } | null;
};
type RawCart = Omit<Cart, 'lines'> & { lines: Connection<CartLine> };

// custom.aromas é list.single_line_text_field → JSON '["Doce","Gourmand"]'. Valor único vem como string.
function parseScents(mf: { value: string } | null): string[] {
  if (!mf?.value) return [];
  try {
    const v = JSON.parse(mf.value);
    return Array.isArray(v) ? v.map(String) : [String(v)];
  } catch {
    return [mf.value];
  }
}

// custom.reviews é JSON: array de {author,rating,text,date,verified,approved}. Só mostramos as aprovadas.
function parseReviews(mf: { value: string } | null): Product['reviews'] {
  if (!mf?.value) return [];
  try {
    const v = JSON.parse(mf.value);
    const arr = Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : [];
    return arr
      .filter((r: { approved?: boolean; rating?: number }) => r && r.approved !== false && Number(r.rating) >= 1)
      .map((r: { author?: string; rating: number; text?: string; date?: string; verified?: boolean; approved?: boolean }) => ({
        author: String(r.author ?? 'Cliente'),
        rating: Math.max(1, Math.min(5, Math.round(Number(r.rating)))),
        text: String(r.text ?? ''),
        date: r.date,
        verified: r.verified,
        approved: r.approved,
      }));
  } catch {
    return [];
  }
}

// custom.peso é texto livre (ex.: "150g"). Fallback: velas de copo são 150g de cera de soja (Figma).
const productWeight = (mf: { value: string } | null, productType: string): string =>
  mf?.value?.trim() || (/vela/i.test(productType) ? '150g' : '');

const normalizeProduct = ({ scent, peso, reviews, ...p }: RawProduct): Product => ({
  ...p,
  images: p.images.nodes,
  variants: p.variants.nodes,
  collections: p.collections?.nodes ?? [],
  scents: parseScents(scent),
  weight: productWeight(peso, p.productType),
  reviews: parseReviews(reviews),
});

const normalizeCart = (c: RawCart): Cart => ({ ...c, lines: c.lines.nodes });

type CartMutationResult = {
  cart: RawCart | null;
  userErrors: { message: string }[];
  warnings?: { code: string; message: string }[];
};

function unwrapCart(result: CartMutationResult | null | undefined): Cart {
  if (!result) {
    throw new Error('Carrinho: a Shopify nao retornou resposta.');
  }
  if (result.userErrors?.length) {
    throw new Error(`Carrinho: ${result.userErrors.map((e) => e.message).join('; ')}`);
  }
  if (!result.cart) {
    throw new Error('Carrinho: a Shopify nao retornou o carrinho.');
  }
  // A Shopify corta a quantidade ao stock disponível e devolve um aviso em vez de um erro —
  // sem isto o cliente pedia 10 e levava 3 sem perceber.
  return { ...normalizeCart(result.cart), warnings: result.warnings ?? [] };
}

type ProductSortKey = 'BEST_SELLING' | 'CREATED_AT' | 'TITLE' | 'PRICE' | 'RELEVANCE';
type GetProductsOpts = { after?: string; sortKey?: ProductSortKey; reverse?: boolean; query?: string };

export async function getProducts(first = 12, opts: GetProductsOpts = {}): Promise<ProductsPage> {
  const data = await shopifyFetch<{
    products: { nodes: RawProduct[]; pageInfo: PageInfo };
  }>(
    PRODUCTS_QUERY,
    {
      first,
      after: opts.after ?? null,
      sortKey: opts.sortKey ?? null,
      reverse: opts.reverse ?? null,
      query: opts.query ?? null,
    },
    { revalidate: REVALIDATE },
  );
  return { products: data.products.nodes.map(normalizeProduct), pageInfo: data.products.pageInfo };
}

export async function getProduct(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<{ product: RawProduct | null }>(
    PRODUCT_BY_HANDLE_QUERY,
    { handle },
    { revalidate: REVALIDATE },
  );
  return data.product ? normalizeProduct(data.product) : null;
}

export async function getProductRecommendations(
  handle: string,
  limit = 8,
  intent: 'RELATED' | 'COMPLEMENTARY' = 'RELATED',
): Promise<Product[]> {
  const data = await shopifyFetch<{ productRecommendations: RawProduct[] | null }>(
    PRODUCT_RECOMMENDATIONS_QUERY,
    { productHandle: handle, intent },
    { revalidate: REVALIDATE },
  );
  return (data.productRecommendations ?? []).slice(0, limit).map(normalizeProduct);
}

// Produtos relacionados para a PDP.
// 1) Tenta o endpoint do Shopify (productRecommendations — melhor quando a loja tem histórico).
// 2) Se vier vazio (ou falhar), usa o fallback determinístico do catálogo (com a regra do
//    queimador para wax melts/snapbars). Ver relatedProducts em lib/filters.
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  // "Leve junto" nativo do Shopify: produtos complementares (Search & Discovery); se não estiverem
  // configurados, cai nos relacionados (RELATED) e, por fim, no fallback determinístico do catálogo.
  const complementary = await getProductRecommendations(product.handle, limit + 4, 'COMPLEMENTARY').catch(() => []);
  const recs = complementary.length > 0
    ? complementary
    : await getProductRecommendations(product.handle, limit + 4, 'RELATED').catch(() => []);
  // Catálogo é SEMPRE buscado (getProducts é cacheado) — garante que a secção nunca fica vazia.
  const catalog = (
    await getProducts(50).catch(() => ({ products: [] as Product[], pageInfo: { hasNextPage: false, endCursor: null } }))
  ).products;
  const cat = productCategory(product);
  const needBurner = cat === 'wax' || cat === 'snap';

  // Base: recomendações do Shopify quando existem; senão, fallback determinístico do catálogo.
  let base = recs.length > 0 ? recs : relatedProducts(product, catalog, limit + 4);

  // Wax melt / snapbar: garantir sempre um queimador em primeiro (o complemento natural).
  if (needBurner) {
    const b = base.find((p) => productCategory(p) === 'burner')
      ?? catalog.find((p) => productCategory(p) === 'burner' && p.id !== product.id);
    if (b) base = [b, ...base.filter((p) => p.id !== b.id)];
  }

  const seen = new Set<string>([product.id]);
  const out: Product[] = [];
  const push = (list: Product[]) => {
    for (const p of list) {
      if (out.length >= limit) return;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
  };
  push(base);
  // Preenche com o catálogo até ao limite — a secção nunca fica vazia (nem curta).
  if (out.length < limit) push(relatedProducts(product, catalog, limit));
  if (out.length < limit) push(catalog.filter((p) => p.id !== product.id));
  return out;
}

type CollectionSortKey = 'BEST_SELLING' | 'CREATED' | 'TITLE' | 'PRICE' | 'MANUAL' | 'RELEVANCE';
type GetCollectionOpts = { sortKey?: CollectionSortKey; reverse?: boolean };

export async function getCollection(
  handle: string,
  first = 48,
  opts: GetCollectionOpts = {},
): Promise<Collection | null> {
  const data = await shopifyFetch<{
    collection: (Omit<Collection, 'products'> & { products: Connection<RawProduct> }) | null;
  }>(
    COLLECTION_BY_HANDLE_QUERY,
    { handle, first, sortKey: opts.sortKey ?? null, reverse: opts.reverse ?? null },
    { revalidate: REVALIDATE },
  );
  if (!data.collection) return null;
  return { ...data.collection, products: data.collection.products.nodes.map(normalizeProduct) };
}

export async function getCollections(first = 50): Promise<CollectionSummary[]> {
  const data = await shopifyFetch<{ collections: { nodes: CollectionSummary[] } }>(
    COLLECTIONS_QUERY,
    { first },
    { revalidate: REVALIDATE },
  );
  return data.collections.nodes;
}

// Escapa o termo para a query syntax do Storefront (aspas/backslash) e restringe a título/tipo/tag.
export async function searchProducts(term: string, first = 12): Promise<Product[]> {
  const clean = term.trim().replace(/["\\]/g, ' ').slice(0, 80);
  if (!clean) return [];
  const { products } = await getProducts(first, { query: clean, sortKey: 'RELEVANCE' });
  return products;
}

// Sugestões do dropdown do header: tolerante a gralhas ("velaa", "cappucino").
export async function predictiveSearch(term: string, limit = 6): Promise<SearchHit[]> {
  const clean = term.trim().slice(0, 80);
  if (!clean) return [];
  const data = await shopifyFetch<{ predictiveSearch: { products: SearchHit[] } | null }>(
    PREDICTIVE_SEARCH_QUERY,
    { q: clean, limit: Math.min(limit, 10) },
    { revalidate: 60 },
  );
  return data.predictiveSearch?.products ?? [];
}

// ---- Cart (sempre fresco: no-store) ----
export async function getCart(id: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cart: RawCart | null }>(CART_QUERY, { id });
  return data.cart ? normalizeCart(data.cart) : null;
}

export async function createCart(lines: CartLineInput[]): Promise<Cart> {
  const data = await shopifyFetch<{ cartCreate: CartMutationResult }>(CART_CREATE, { lines });
  return unwrapCart(data.cartCreate);
}

export async function addCartLines(cartId: string, lines: CartLineInput[]): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesAdd: CartMutationResult }>(CART_LINES_ADD, {
    cartId,
    lines,
  });
  return unwrapCart(data.cartLinesAdd);
}

export async function updateCartLines(
  cartId: string,
  lines: CartLineUpdateInput[],
): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesUpdate: CartMutationResult }>(CART_LINES_UPDATE, {
    cartId,
    lines,
  });
  return unwrapCart(data.cartLinesUpdate);
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesRemove: CartMutationResult }>(CART_LINES_REMOVE, {
    cartId,
    lineIds,
  });
  return unwrapCart(data.cartLinesRemove);
}

export async function updateCartDiscountCodes(cartId: string, discountCodes: string[]): Promise<Cart> {
  const data = await shopifyFetch<{ cartDiscountCodesUpdate: CartMutationResult }>(
    CART_DISCOUNT_CODES_UPDATE,
    { cartId, discountCodes },
  );
  return unwrapCart(data.cartDiscountCodesUpdate);
}

export async function updateCartNote(cartId: string, note: string): Promise<Cart> {
  const data = await shopifyFetch<{ cartNoteUpdate: CartMutationResult }>(CART_NOTE_UPDATE, { cartId, note });
  return unwrapCart(data.cartNoteUpdate);
}
