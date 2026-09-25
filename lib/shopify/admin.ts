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
