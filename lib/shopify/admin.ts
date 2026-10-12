// Cliente da Admin API (somente servidor) via client_credentials grant, com cache do token de 24h.
// Usado por rotas que precisam de ESCRITA (ex.: envio de avaliações para metafields).
const API_VERSION = '2026-07';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<{ domain: string; token: string }> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      'Admin API não configurada (SHOPIFY_STORE_DOMAIN / SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET).',
    );
  }
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return { domain, token: cachedToken.token };
  }
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const grant = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!grant.access_token) throw new Error('Falha no client_credentials grant (Admin API).');
  // Renova 1 min antes de expirar para não usar um token que morre no meio da requisição.
  cachedToken = {
    token: grant.access_token,
    expiresAt: Date.now() + (grant.expires_in ?? 86000) * 1000 - 60_000,
  };
  return { domain, token: grant.access_token };
}

export async function adminFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  version = API_VERSION,
): Promise<T> {
  const { domain, token } = await getToken();
  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const json = (await response.json()) as { data?: T; errors?: unknown };
  if (json.errors) throw new Error(`Admin GraphQL: ${JSON.stringify(json.errors)}`);
  if (!json.data) throw new Error('Admin API: resposta sem dados.');
  return json.data;
}

type VariantStockNode = {
  id: string;
  inventoryQuantity: number | null;
  inventoryPolicy: string;
  inventoryItem: { tracked: boolean };
} | null;

// Estoque por variante (a Storefront API não o expõe sem o scope
// unauthenticated_read_product_inventory). null = sem limite (estoque não controlado ou "continuar
// vendendo sem estoque"). Em caso de falha → {} (a UI fica sem limite; o carrinho da Shopify
// continua cortando no estoque real).
export async function getVariantStock(
  variantIds: string[],
): Promise<Record<string, number | null>> {
  if (!variantIds.length) return {};
  try {
    const data = await adminFetch<{ nodes: VariantStockNode[] }>(
      `query($ids:[ID!]!){ nodes(ids:$ids){ ... on ProductVariant{
        id inventoryQuantity inventoryPolicy inventoryItem{ tracked } } } }`,
      { ids: variantIds },
    );
    return Object.fromEntries(
      data.nodes
        .filter((variant): variant is NonNullable<VariantStockNode> => !!variant?.id)
        .map((variant) => [
          variant.id,
          variant.inventoryItem.tracked && variant.inventoryPolicy === 'DENY'
            ? Math.max(0, variant.inventoryQuantity ?? 0)
            : null,
        ]),
    );
  } catch {
    return {};
  }
}

// ── Promoções ativas (descontos em produtos e "Compre X leve Y") ────────────────────────────────
export type PromoEffect =
  { kind: 'amount'; amount: number; each: boolean } | { kind: 'percent'; percentage: number };
export type Promo = {
  title: string;
  automatic: boolean; // false = só com código (o preço do conjunto não leva o desconto)
  productHandles: string[]; // produtos abrangidos (buys + gets no BXGY)
  collectionHandles: string[]; // coleções abrangidas
  effect: PromoEffect | null;
  /** BXGY: só estes recebem o efeito, e no máximo `quantity` unidades. */
  gets?: { productHandles: string[]; collectionHandles: string[]; quantity: number };
};

// Fragmentos GraphQL reaproveitados nos quatro tipos de desconto (automático/código × básico/BXGY).
const ITEMS_FRAGMENT = `... on DiscountProducts{ products(first:50){ nodes{ handle } }
    productVariants(first:50){ nodes{ product{ handle } } } }
  ... on DiscountCollections{ collections(first:20){ nodes{ handle } } }`;
const VALUE_FRAGMENT = `... on DiscountAmount{ amount{ amount } appliesOnEachItem }
  ... on DiscountPercentage{ percentage }
  ... on DiscountOnQuantity{ quantity{ quantity } effect{
    ... on DiscountAmount{ amount{ amount } appliesOnEachItem } ... on DiscountPercentage{ percentage } } }`;
const BASIC_FIELDS = `title status customerGets{ items{ ${ITEMS_FRAGMENT} } value{ ${VALUE_FRAGMENT} } }`;
const BXGY_FIELDS = `title status customerBuys{ items{ ${ITEMS_FRAGMENT} } }
  customerGets{ items{ ${ITEMS_FRAGMENT} } value{ ${VALUE_FRAGMENT} } }`;

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

const itemProductHandles = (items?: RawItems) => [
  ...(items?.products?.nodes.map((node) => node.handle) ?? []),
  ...(items?.productVariants?.nodes.map((node) => node.product.handle) ?? []),
];
const itemCollectionHandles = (items?: RawItems) =>
  items?.collections?.nodes.map((node) => node.handle) ?? [];
const toEffect = (value?: RawValue): PromoEffect | null =>
  value?.percentage != null
    ? { kind: 'percent', percentage: value.percentage }
    : value?.amount
      ? { kind: 'amount', amount: Number(value.amount.amount), each: !!value.appliesOnEachItem }
      : null;

// ponytail: cache em memória de 5 min — descontos mudam raramente; sem invalidação por webhook.
let promoCache: { at: number; promos: Promo[] } | null = null;

export async function getActivePromos(): Promise<Promo[]> {
  if (promoCache && Date.now() - promoCache.at < 5 * 60_000) return promoCache.promos;
  try {
    const data = await adminFetch<{ discountNodes: { nodes: { discount: RawDiscount }[] } }>(
      `{ discountNodes(first:100, query:"status:active"){ nodes{ discount{ __typename
        ... on DiscountAutomaticBasic{ ${BASIC_FIELDS} } ... on DiscountCodeBasic{ ${BASIC_FIELDS} }
        ... on DiscountAutomaticBxgy{ ${BXGY_FIELDS} } ... on DiscountCodeBxgy{ ${BXGY_FIELDS} } } } } }`,
    );
    const promos: Promo[] = [];
    for (const { discount } of data.discountNodes.nodes) {
      if (discount.status !== 'ACTIVE' || !discount.customerGets) continue;
      const automatic = discount.__typename.startsWith('DiscountAutomatic');
      const getsHandles = itemProductHandles(discount.customerGets.items);
      const getsCollections = itemCollectionHandles(discount.customerGets.items);
      if (discount.__typename.endsWith('Bxgy')) {
        const value = discount.customerGets.value;
        const buysItems = discount.customerBuys?.items;
        promos.push({
          title: discount.title ?? '',
          automatic,
          productHandles: [...new Set([...itemProductHandles(buysItems), ...getsHandles])],
          collectionHandles: [
            ...new Set([...itemCollectionHandles(buysItems), ...getsCollections]),
          ],
          effect: toEffect(value.effect),
          gets: {
            productHandles: getsHandles,
            collectionHandles: getsCollections,
            quantity: Number(value.quantity?.quantity ?? 1),
          },
        });
      } else {
        promos.push({
          title: discount.title ?? '',
          automatic,
          productHandles: getsHandles,
          collectionHandles: getsCollections,
          effect: toEffect(discount.customerGets.value),
        });
      }
    }
    promoCache = { at: Date.now(), promos };
    return promos;
  } catch {
    // Admin API fora do ar: serve o último resultado (mesmo vencido) em vez de sumir com as
    // promoções.
    return promoCache?.promos ?? [];
  }
}

// ── Tarifas de envio (Definições → Frete e entrega) ──────────────────────────────────────────────
// O site não guarda valores de portes: lê as zonas e tarifas do perfil de envio da Shopify.
export type ShippingRate = { name: string; price: number; minKg: number | null; maxKg: number | null };
// days: prazo de entrega = "Tempo de trânsito" do 1.º escalão da zona (em dias).
export type ShippingZone = { name: string; rates: ShippingRate[]; days: { min: number; max: number } | null };

type RawCondition = {
  field: string;
  operator: string;
  conditionCriteria: { value?: number; unit?: string };
};
type RawMethod = {
  name: string;
  active: boolean;
  rateProvider: { price?: { amount: string }; minTransitTime?: number | null; maxTransitTime?: number | null };
  methodConditions: RawCondition[];
};

const toKg = ({ value = 0, unit }: { value?: number; unit?: string }) =>
  unit === 'GRAMS' ? value / 1000 : unit === 'POUNDS' ? value * 0.4536 : unit === 'OUNCES' ? value * 0.02835 : value;

// ponytail: cache em memória de 5 min, como as promoções — tarifas mudam raramente.
let shippingCache: { at: number; zones: ShippingZone[] } | null = null;

export async function getShippingZones(): Promise<ShippingZone[]> {
  if (shippingCache && Date.now() - shippingCache.at < 5 * 60_000) return shippingCache.zones;
  try {
    const data = await adminFetch<{
      deliveryProfiles: { nodes: { default: boolean; profileLocationGroups: {
        locationGroupZones: { nodes: { zone: { name: string }; methodDefinitions: { nodes: RawMethod[] } }[] };
      }[] }[] };
    }>(
      `{ deliveryProfiles(first:10){ nodes{ default profileLocationGroups{ locationGroupZones(first:20){ nodes{
        zone{ name } methodDefinitions(first:50){ nodes{ name active
          rateProvider{ ... on DeliveryRateDefinition{ price{ amount } minTransitTime maxTransitTime } }
          methodConditions{ field operator conditionCriteria{ ... on Weight{ value unit } } } } } } } } } } }`,
      {},
      // ponytail: o tempo de trânsito só existe na API unstable; se ela mudar, cai no catch e a
      // página Envios mostra "o valor aparece no checkout".
      'unstable',
    );
    // Só o perfil geral: perfis personalizados valem para produtos específicos.
    const profile = data.deliveryProfiles.nodes.find((node) => node.default);
    const zones = (profile?.profileLocationGroups ?? []).flatMap((group) =>
      group.locationGroupZones.nodes.map(({ zone, methodDefinitions }) => {
        const rates = methodDefinitions.nodes
          .filter((method) => method.active && method.rateProvider.price)
          .map((method) => {
            const weight = (op: string) => {
              const condition = method.methodConditions.find(
                (c) => c.field === 'TOTAL_WEIGHT' && c.operator.startsWith(op),
              );
              return condition ? toKg(condition.conditionCriteria) : null;
            };
            return {
              name: method.name,
              price: Number(method.rateProvider.price!.amount),
              minKg: weight('GREATER'),
              maxKg: weight('LESS'),
              transit: method.rateProvider,
            };
          })
          .sort((a, b) => (a.minKg ?? 0) - (b.minKg ?? 0) || a.price - b.price);
        const transit = rates[0]?.transit;
        const days = transit?.minTransitTime && transit.maxTransitTime
          ? { min: transit.minTransitTime / 86_400, max: transit.maxTransitTime / 86_400 }
          : null;
        return { name: zone.name, rates: rates.map(({ transit: _, ...rate }) => rate), days };
      }),
    );
    shippingCache = { at: Date.now(), zones };
    return zones;
  } catch {
    return shippingCache?.zones ?? [];
  }
}

// ── Packs (desconto por código aplicado automaticamente pelo site) ──────────────────────────────
// Convenção na Shopify: desconto por código cujo título começa por "Pack" (ex.: "Pack Trio
// Outono"). Os produtos a que ele se aplica são o pack: com 1 de cada no carrinho, o site aplica o
// código; sem eles, remove-o. Valor, datas e combinações configuram-se no próprio desconto.
export type PackCode = { title: string; code: string; productHandles: string[] };

// ponytail: cache em memória de 5 min, como as promoções.
let packCache: { at: number; packs: PackCode[] } | null = null;

export async function getPackCodes(): Promise<PackCode[]> {
  if (packCache && Date.now() - packCache.at < 5 * 60_000) return packCache.packs;
  try {
    const data = await adminFetch<{
      codeDiscountNodes: { nodes: { codeDiscount: {
        title?: string;
        status?: string;
        codes?: { nodes: { code: string }[] };
        customerGets?: { items: RawItems };
      } }[] };
    }>(
      `{ codeDiscountNodes(first:50, query:"status:active"){ nodes{ codeDiscount{
        ... on DiscountCodeBasic{ title status codes(first:1){ nodes{ code } } customerGets{ items{ ${ITEMS_FRAGMENT} } } } } } } }`,
    );
    const packs = data.codeDiscountNodes.nodes
      .map(({ codeDiscount }) => codeDiscount)
      .filter((discount) => discount.status === 'ACTIVE' && /^pack\b/i.test(discount.title ?? ''))
      .map((discount) => ({
        title: discount.title!,
        code: discount.codes?.nodes[0]?.code ?? '',
        productHandles: [...new Set(itemProductHandles(discount.customerGets?.items))],
      }))
      .filter((pack) => pack.code && pack.productHandles.length);
    packCache = { at: Date.now(), packs };
    return packs;
  } catch {
    return packCache?.packs ?? [];
  }
}
