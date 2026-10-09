// Cliente Admin API (server-only) via client_credentials grant, com cache do token de 24h.
// Usado por rotas que precisam de ESCRITA (ex.: submissão de reviews em metafields).
const API_VERSION = '2026-07';

let cached: { token: string; exp: number } | null = null;

async function getToken(): Promise<{ domain: string; token: string }> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const id = process.env.SHOPIFY_CLIENT_ID;
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!domain || !id || !secret) {
    throw new Error('Admin API não configurada (SHOPIFY_STORE_DOMAIN / SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET).');
  }
  if (cached && Date.now() < cached.exp) return { domain, token: cached.token };
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
  });
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) throw new Error('Falha no client_credentials grant (Admin API).');
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 86000) * 1000 - 60_000 };
  return { domain, token: j.access_token };
}

export async function adminFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const { domain, token } = await getToken();
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const j = (await res.json()) as { data?: T; errors?: unknown };
  if (j.errors) throw new Error(`Admin GraphQL: ${JSON.stringify(j.errors)}`);
  if (!j.data) throw new Error('Admin API: resposta sem dados.');
  return j.data;
}

// Stock por variante (a Storefront API não o expõe sem o scope unauthenticated_read_product_inventory).
// null = sem limite (stock não seguido ou "continuar a vender sem stock"). Falha → {} (UI fica sem limite;
// o carrinho da Shopify continua a cortar ao stock real).
export async function getStock(variantIds: string[]): Promise<Record<string, number | null>> {
  if (!variantIds.length) return {};
  try {
    const d = await adminFetch<{
      nodes: ({ id: string; inventoryQuantity: number | null; inventoryPolicy: string; inventoryItem: { tracked: boolean } } | null)[];
    }>(
      `query($ids:[ID!]!){ nodes(ids:$ids){ ... on ProductVariant{ id inventoryQuantity inventoryPolicy inventoryItem{ tracked } } } }`,
      { ids: variantIds },
    );
    return Object.fromEntries(
      d.nodes.filter((n) => n?.id).map((n) => [n!.id, n!.inventoryItem.tracked && n!.inventoryPolicy === 'DENY' ? Math.max(0, n!.inventoryQuantity ?? 0) : null]),
    );
  } catch {
    return {};
  }
}

// ── Promoções ativas (descontos em produtos e "Compre X leve Y") ────────────────────────────────
export type PromoEffect = { kind: 'amount'; amount: number; each: boolean } | { kind: 'percent'; pct: number };
export type Promo = {
  title: string;
  automatic: boolean; // false = só com código (o preço junto não leva o desconto)
  handles: string[]; // produtos abrangidos (buys + gets no BXGY)
  collections: string[]; // coleções abrangidas
  effect: PromoEffect | null;
  /** BXGY: só estes levam o efeito, e no máximo `getQty` unidades. */
  gets?: { handles: string[]; collections: string[]; qty: number };
};

const ITEMS = `... on DiscountProducts{ products(first:50){ nodes{ handle } } productVariants(first:50){ nodes{ product{ handle } } } }
  ... on DiscountCollections{ collections(first:20){ nodes{ handle } } }`;
const VALUE = `... on DiscountAmount{ amount{ amount } appliesOnEachItem } ... on DiscountPercentage{ percentage }
  ... on DiscountOnQuantity{ quantity{ quantity } effect{ ... on DiscountAmount{ amount{ amount } appliesOnEachItem } ... on DiscountPercentage{ percentage } } }`;
const BASIC = `title status customerGets{ items{ ${ITEMS} } value{ ${VALUE} } }`;
const BXGY = `title status customerBuys{ items{ ${ITEMS} } } customerGets{ items{ ${ITEMS} } value{ ${VALUE} } }`;

type RawItems = {
  products?: { nodes: { handle: string }[] };
  productVariants?: { nodes: { product: { handle: string } }[] };
  collections?: { nodes: { handle: string }[] };
};
type RawValue = {
  amount?: { amount: string };
  appliesOnEachItem?: boolean;
  percentage?: number;
  quantity?: { quantity: string };
  effect?: RawValue;
};
type RawDiscount = {
  __typename: string;
  title?: string;
  status?: string;
  customerBuys?: { items: RawItems };
  customerGets?: { items: RawItems; value: RawValue };
};

const itemHandles = (i?: RawItems) => [
  ...(i?.products?.nodes.map((n) => n.handle) ?? []),
  ...(i?.productVariants?.nodes.map((n) => n.product.handle) ?? []),
];
const itemCols = (i?: RawItems) => i?.collections?.nodes.map((n) => n.handle) ?? [];
const toEffect = (v?: RawValue): PromoEffect | null =>
  v?.percentage != null
    ? { kind: 'percent', pct: v.percentage }
    : v?.amount
      ? { kind: 'amount', amount: Number(v.amount.amount), each: !!v.appliesOnEachItem }
      : null;

// ponytail: cache em memória de 5 min — descontos mudam raramente; sem invalidação por webhook.
let promoCache: { at: number; promos: Promo[] } | null = null;

export async function getActivePromos(): Promise<Promo[]> {
  if (promoCache && Date.now() - promoCache.at < 5 * 60_000) return promoCache.promos;
  try {
    const d = await adminFetch<{ discountNodes: { nodes: { discount: RawDiscount }[] } }>(
      `{ discountNodes(first:100, query:"status:active"){ nodes{ discount{ __typename
        ... on DiscountAutomaticBasic{ ${BASIC} } ... on DiscountCodeBasic{ ${BASIC} }
        ... on DiscountAutomaticBxgy{ ${BXGY} } ... on DiscountCodeBxgy{ ${BXGY} } } } } }`,
    );
    const promos: Promo[] = [];
    for (const { discount: x } of d.discountNodes.nodes) {
      if (x.status !== 'ACTIVE' || !x.customerGets) continue;
      const automatic = x.__typename.startsWith('DiscountAutomatic');
      const getsH = itemHandles(x.customerGets.items);
      const getsC = itemCols(x.customerGets.items);
      if (x.__typename.endsWith('Bxgy')) {
        const v = x.customerGets.value;
        promos.push({
          title: x.title ?? '',
          automatic,
          handles: [...new Set([...itemHandles(x.customerBuys?.items), ...getsH])],
          collections: [...new Set([...itemCols(x.customerBuys?.items), ...getsC])],
          effect: toEffect(v.effect),
          gets: { handles: getsH, collections: getsC, qty: Number(v.quantity?.quantity ?? 1) },
        });
      } else {
        promos.push({ title: x.title ?? '', automatic, handles: getsH, collections: getsC, effect: toEffect(x.customerGets.value) });
      }
    }
    promoCache = { at: Date.now(), promos };
    return promos;
  } catch {
    return promoCache?.promos ?? [];
  }
}
