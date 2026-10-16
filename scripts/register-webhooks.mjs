// Regista o webhook orders/create → /api/webhooks/orders-create (desconta o stock dos itens dos
// packs de escolha). Idempotente: se já existir para o mesmo URL, não duplica.
// Uso: node scripts/register-webhooks.mjs [--url https://playfulcandles.com] [--list] [--delete <gid>]
import { readFileSync } from 'node:fs';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const dom = env.SHOPIFY_STORE_DOMAIN;
const tk = await (await fetch(`https://${dom}/admin/oauth/access_token`, {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET }),
})).json();
const admin = async (query, variables = {}) => {
  const j = await (await fetch(`https://${dom}/admin/api/2026-07/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': tk.access_token },
    body: JSON.stringify({ query, variables }),
  })).json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
};
const check = (label, errs) => { if (errs?.length) throw new Error(`${label}: ${JSON.stringify(errs)}`); };

const { webhookSubscriptions } = await admin(`{ webhookSubscriptions(first:50){ nodes{ id topic uri } } }`);
if (process.argv.includes('--list')) { console.table(webhookSubscriptions.nodes); process.exit(0); }

const del = arg('--delete');
if (del) {
  const d = await admin(`mutation($id:ID!){ webhookSubscriptionDelete(id:$id){ userErrors{ message } } }`, { id: del });
  check('delete', d.webhookSubscriptionDelete.userErrors);
  console.log(`apagado ${del}`); process.exit(0);
}

const uri = `${(arg('--url') ?? env.NEXT_PUBLIC_SITE_URL ?? 'https://playfulcandles.com').replace(/\/$/, '')}/api/webhooks/orders-create`;
const existing = webhookSubscriptions.nodes.find((w) => w.topic === 'ORDERS_CREATE' && w.uri === uri);
if (existing) { console.log(`já existe: ${existing.id} → ${uri}`); process.exit(0); }

const c = await admin(`mutation($sub:WebhookSubscriptionInput!){
  webhookSubscriptionCreate(topic: ORDERS_CREATE, webhookSubscription:$sub){ webhookSubscription{ id uri } userErrors{ field message } } }`,
  { sub: { uri, format: 'JSON' } });
check('webhookSubscriptionCreate', c.webhookSubscriptionCreate.userErrors);
console.log(`ok — ${c.webhookSubscriptionCreate.webhookSubscription.id} → ${uri}`);
