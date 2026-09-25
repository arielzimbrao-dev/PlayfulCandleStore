const API_VERSION = '2026-07';

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

type FetchOpts = {
  /** ISR: seconds to cache. Omit/false for always-fresh (`no-store`, e.g. cart). */
  revalidate?: number | false;
};

/**
 * Executa uma operacao GraphQL contra a Storefront API.
 * Server-only: usa o token privado se disponivel, senao o publico.
 * Leituras (produtos/coleções) passam `{ revalidate }` para ISR; o carrinho fica `no-store`.
 */
export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  opts: FetchOpts = {},
): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  const publicToken = process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN;

  const authHeader: Record<string, string> = privateToken
    ? { 'Shopify-Storefront-Private-Token': privateToken }
    : publicToken
      ? { 'X-Shopify-Storefront-Access-Token': publicToken }
      : {};

  if (!domain || Object.keys(authHeader).length === 0) {
    throw new Error(
      'Variaveis de ambiente ausentes: defina SHOPIFY_STORE_DOMAIN e um token do Storefront API.',
    );
  }

  const cacheOpts =
    typeof opts.revalidate === 'number'
      ? { next: { revalidate: opts.revalidate } as const }
      : { cache: 'no-store' as const };

  const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({ query, variables }),
    ...cacheOpts,
  });

  if (!res.ok) {
    throw new Error(`Shopify HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  if (!json.data) {
    throw new Error('Shopify: resposta sem dados.');
  }

  return json.data;
}
