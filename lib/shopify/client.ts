const API_VERSION = '2026-07';

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

type FetchOptions = {
  /** ISR: segundos de cache. Omitir/false para sempre fresco (`no-store`, ex.: carrinho). */
  revalidate?: number | false;
};

/**
 * Executa uma operação GraphQL contra a Storefront API.
 * Somente servidor: usa o token privado se disponível, senão o público.
 * Leituras (produtos/coleções) passam `{ revalidate }` para ISR; o carrinho fica `no-store`.
 */
export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: FetchOptions = {},
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

  const cacheOptions =
    typeof options.revalidate === 'number'
      ? { next: { revalidate: options.revalidate } as const }
      : { cache: 'no-store' as const };

  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({ query, variables }),
    ...cacheOptions,
  });

  if (!response.ok) {
    throw new Error(`Shopify HTTP ${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  if (!json.data) {
    throw new Error('Shopify: resposta sem dados.');
  }

  return json.data;
}
