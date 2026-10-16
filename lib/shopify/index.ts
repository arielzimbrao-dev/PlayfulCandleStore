import { shopifyFetch } from './client';
import { fallbackRelatedProducts, productCategory } from '../filters';
import type { CollectionSortKey, ProductSortKey } from '../sort';
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
  Review,
  SearchHit,
} from './types';

const REVALIDATE = 60 * 60; // ISR de 1h para as leituras da loja

// A API retorna conexões { nodes: [] }; achatamos para arrays simples.
type Connection<T> = { nodes: T[] };
type RawProduct = Omit<
  Product,
  'images' | 'variants' | 'collections' | 'scents' | 'weight' | 'reviews' | 'packSlots'
> & {
  images: Connection<Image>;
  variants: Connection<ProductVariant>;
  collections: Connection<{ title: string; handle: string }>;
  scent: { value: string } | null;
  peso: { value: string } | null;
  packSlots: { value: string } | null;
};
type RawAllocation = { discountedAmount: { amount: string; currencyCode: string }; code?: string };
type RawCart = Omit<Cart, 'lines'> & {
  discountAllocations: RawAllocation[];
  lines: Connection<CartLine & { discountAllocations: RawAllocation[] }>;
};

type Metafield = { value: string } | null;

// custom.aromas é list.single_line_text_field → JSON '["Doce","Gourmand"]'. Valor único vem como
// string pura (JSON inválido), por isso o fallback no catch.
function parseScents(metafield: Metafield): string[] {
  if (!metafield?.value) return [];
  try {
    const parsed = JSON.parse(metafield.value);
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    return [metafield.value];
  }
}

// Foto da avaliação: só https:// ou caminho local (/…); qualquer outra coisa é ignorada.
const safePhoto = (photo: unknown) =>
  typeof photo === 'string' && /^(https:\/\/|\/[^/])/.test(photo) ? photo : undefined;

type ReviewField = { value: string } | null;
type RawReviewNode = {
  produto: ReviewField;
  nome: ReviewField;
  classificacao: ReviewField;
  comentario: ReviewField;
  data: ReviewField;
  compra_verificada: ReviewField;
  foto: ReviewField;
};

// Avaliações = metaobjects "avaliacao" (scripts/setup-reviews.mjs). O Storefront só devolve as
// ATIVAS — rascunho é pendente de aprovação no admin. Cache curto para a aprovação chegar ao site
// em minutos. ponytail: 250 avaliações numa só página; paginar quando a loja passar disso.
export async function getReviewsByProduct(): Promise<Map<string, Review[]>> {
  const byProduct = new Map<string, Review[]>();
  const data = await shopifyFetch<{ metaobjects: { nodes: RawReviewNode[] } }>(
    `{ metaobjects(type:"avaliacao", first:250){ nodes{
      produto: field(key:"produto"){ value } nome: field(key:"nome"){ value }
      classificacao: field(key:"classificacao"){ value } comentario: field(key:"comentario"){ value }
      data: field(key:"data"){ value } compra_verificada: field(key:"compra_verificada"){ value }
      foto: field(key:"foto"){ value } } } }`,
    {},
    { revalidate: 300 },
  ).catch(() => null);
  for (const node of data?.metaobjects.nodes ?? []) {
    const productId = node.produto?.value;
    let rating = 0;
    try {
      rating = Math.round(Number(JSON.parse(node.classificacao?.value ?? '{}').value));
    } catch {}
    if (!productId || !(rating >= 1 && rating <= 5)) continue;
    const list = byProduct.get(productId) ?? [];
    list.push({
      author: node.nome?.value || 'Cliente',
      rating,
      text: node.comentario?.value ?? '',
      date: node.data?.value,
      verified: node.compra_verificada?.value === 'true',
      photo: safePhoto(node.foto?.value),
    });
    byProduct.set(productId, list);
  }
  // Mais recentes primeiro.
  for (const list of byProduct.values()) list.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  return byProduct;
}

// custom.peso é texto livre (ex.: "150g"). Fallback por tipo: vela 150g · wax melt 100g ·
// snapbar 50g.
const WEIGHT_BY_TYPE: [RegExp, string][] = [
  [/vela/i, '150g'],
  [/wax\s*melt/i, '100g'],
  [/snapbar/i, '50g'],
];
const productWeight = (metafield: Metafield, productType: string): string =>
  metafield?.value?.trim() ||
  WEIGHT_BY_TYPE.find(([pattern]) => pattern.test(productType))?.[1] ||
  '';

// custom.pack_slots é JSON editável no admin: descarta entradas sem label/tipo válido.
const SLOT_TYPES = ['velas', 'wax', 'snap', 'burner'];
function parsePackSlots(metafield: Metafield): Product['packSlots'] {
  if (!metafield?.value) return [];
  try {
    const parsed = JSON.parse(metafield.value);
    return (Array.isArray(parsed) ? parsed : []).filter(
      (slot) => typeof slot?.label === 'string' && SLOT_TYPES.includes(slot.type),
    );
  } catch {
    return [];
  }
}

const normalizeProduct = ({ scent, peso, packSlots, ...product }: RawProduct): Product => ({
  ...product,
  images: product.images.nodes,
  variants: product.variants.nodes,
  collections: product.collections?.nodes ?? [],
  scents: parseScents(scent),
  weight: productWeight(peso, product.productType),
  reviews: [], // preenchido por getProduct (getReviewsByProduct)
  packSlots: parsePackSlots(packSlots),
});

// Soma o que cada código desconta (nas linhas e no total do carrinho) e descarta as alocações
// cruas — elas trazem o código, que para os packs não deve chegar ao browser.
function normalizeCart({ discountAllocations, lines, ...cart }: RawCart): Cart {
  const allocations = [...discountAllocations, ...lines.nodes.flatMap((line) => line.discountAllocations)];
  return {
    ...cart,
    discountCodes: cart.discountCodes.map((discount) => {
      const matching = allocations.filter((a) => a.code?.toLowerCase() === discount.code.toLowerCase());
      if (!matching.length) return discount;
      const amount = matching.reduce((sum, a) => sum + Number(a.discountedAmount.amount), 0);
      return { ...discount, amount: { amount: amount.toFixed(2), currencyCode: matching[0].discountedAmount.currencyCode } };
    }),
    lines: lines.nodes.map(({ discountAllocations: _, ...line }) => line),
  };
}

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
  // A Shopify corta a quantidade no estoque disponível e devolve um aviso em vez de um erro —
  // sem repassar isso, o cliente pedia 10 e levava 3 sem perceber.
  return { ...normalizeCart(result.cart), warnings: result.warnings ?? [] };
}

type GetProductsOptions = {
  after?: string;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  query?: string;
};

export async function getProducts(
  first = 12,
  options: GetProductsOptions = {},
): Promise<ProductsPage> {
  const data = await shopifyFetch<{
    products: { nodes: RawProduct[]; pageInfo: PageInfo };
  }>(
    PRODUCTS_QUERY,
    {
      first,
      after: options.after ?? null,
      sortKey: options.sortKey ?? null,
      reverse: options.reverse ?? null,
      query: options.query ?? null,
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
  if (!data.product) return null;
  const product = normalizeProduct(data.product);
  return { ...product, reviews: (await getReviewsByProduct()).get(product.id) ?? [] };
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

// Produtos relacionados para a PDP, em cascata:
// 1) complementares do Shopify (Search & Discovery, "Leve junto" nativo);
// 2) se não estiverem configurados, os relacionados (RELATED — melhor quando a loja tem histórico);
// 3) por fim, o fallback determinístico do catálogo (ver fallbackRelatedProducts em lib/filters).
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const complementary = await getProductRecommendations(
    product.handle,
    limit + 4,
    'COMPLEMENTARY',
  ).catch(() => []);
  const recommendations =
    complementary.length > 0
      ? complementary
      : await getProductRecommendations(product.handle, limit + 4, 'RELATED').catch(() => []);
  // O catálogo é SEMPRE buscado (getProducts tem cache) — garante que a seção nunca fica vazia.
  const catalog = await getProducts(50)
    .then((page) => page.products)
    .catch(() => [] as Product[]);
  const category = productCategory(product);
  const needsBurner = category === 'wax' || category === 'snap';

  let candidates =
    recommendations.length > 0 ? recommendations : fallbackRelatedProducts(product, catalog, limit + 4);

  // Wax melt / snapbar: garantir sempre um queimador em primeiro (o complemento natural).
  if (needsBurner) {
    const burner =
      candidates.find((candidate) => productCategory(candidate) === 'burner') ??
      catalog.find(
        (candidate) => productCategory(candidate) === 'burner' && candidate.id !== product.id,
      );
    if (burner) {
      candidates = [burner, ...candidates.filter((candidate) => candidate.id !== burner.id)];
    }
  }

  const seen = new Set<string>([product.id]);
  const related: Product[] = [];
  const addUnique = (list: Product[]) => {
    for (const candidate of list) {
      if (related.length >= limit) return;
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      related.push(candidate);
    }
  };
  addUnique(candidates);
  // Completa com o catálogo até o limite — a seção nunca fica vazia (nem curta).
  if (related.length < limit) addUnique(fallbackRelatedProducts(product, catalog, limit));
  if (related.length < limit) addUnique(catalog.filter((other) => other.id !== product.id));
  return related;
}

type GetCollectionOptions = { sortKey?: CollectionSortKey; reverse?: boolean };

export async function getCollection(
  handle: string,
  first = 48,
  options: GetCollectionOptions = {},
): Promise<Collection | null> {
  const data = await shopifyFetch<{
    collection: (Omit<Collection, 'products'> & { products: Connection<RawProduct> }) | null;
  }>(
    COLLECTION_BY_HANDLE_QUERY,
    { handle, first, sortKey: options.sortKey ?? null, reverse: options.reverse ?? null },
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

// Troca aspas/barra invertida por espaço para o termo não quebrar a sintaxe de query do Storefront.
export async function searchProducts(term: string, first = 12): Promise<Product[]> {
  const sanitizedTerm = term.trim().replace(/["\\]/g, ' ').slice(0, 80);
  if (!sanitizedTerm) return [];
  const { products } = await getProducts(first, { query: sanitizedTerm, sortKey: 'RELEVANCE' });
  return products;
}

// Sugestões do dropdown do header: tolerante a erros de digitação ("velaa", "cappucino").
// O limite é travado em 10, o máximo aceito pela predictiveSearch.
export async function predictiveSearch(term: string, limit = 6): Promise<SearchHit[]> {
  const trimmedTerm = term.trim().slice(0, 80);
  if (!trimmedTerm) return [];
  const data = await shopifyFetch<{ predictiveSearch: { products: SearchHit[] } | null }>(
    PREDICTIVE_SEARCH_QUERY,
    { q: trimmedTerm, limit: Math.min(limit, 10) },
    { revalidate: 60 },
  );
  return data.predictiveSearch?.products ?? [];
}

// ---- Carrinho (sempre fresco: no-store) ----
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

export async function updateCartLines(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart> {
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

export async function updateCartDiscountCodes(
  cartId: string,
  discountCodes: string[],
): Promise<Cart> {
  const data = await shopifyFetch<{ cartDiscountCodesUpdate: CartMutationResult }>(
    CART_DISCOUNT_CODES_UPDATE,
    { cartId, discountCodes },
  );
  return unwrapCart(data.cartDiscountCodesUpdate);
}
