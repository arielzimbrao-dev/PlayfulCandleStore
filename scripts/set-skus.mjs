// SKU por produto (formato TIPO-NOME). Uso: node scripts/set-skus.mjs --dry  |  node scripts/set-skus.mjs
import { readFileSync } from 'node:fs';

const SKU = {
  'purple-vanilla': 'VELA-PURPLE-VANILLA', 'passion-fruit': 'VELA-PASSION-FRUIT', 'sea-breeze': 'VELA-SEA-BREEZE',
  'lemon-raspberry': 'VELA-LEMON-RASPBERRY', 'cotton-flower': 'VELA-COTTON-FLOWER', cappuccino: 'VELA-CAPPUCCINO',
  'orange-cinnamon': 'VELA-ORANGE-CINNAMON', 'pumpkin-spice': 'VELA-PUMPKIN-SPICE',
  'dama-da-noite': 'SNAP-DAMA-DA-NOITE', 'cappuccino-break': 'SNAP-CAPPUCCINO-BREAK', 'sweet-strawberry': 'SNAP-SWEET-STRAWBERRY',
  'maca-do-amor': 'SNAP-MACA-DO-AMOR', 'salt-caramel': 'SNAP-SALTED-CARAMEL', 'orange-fruit': 'SNAP-ORANGE-FRUIT',
  'lemon-and-raspberry-snapbar': 'SNAP-LEMON-RASPBERRY',
  'under-the-sea': 'WAX-UNDER-THE-SEA', 'waffles-berries': 'WAX-WAFFLES-BERRIES', 'cinnamon-rolls': 'WAX-CINNAMON-ROLLS',
  'queimador-grecia': 'QUEIM-GRECIA', 'queimador-dubai': 'QUEIM-DUBAI', 'queimador-amsterda': 'QUEIM-AMSTERDA',
  'combo-gourmet': 'COMBO-GOURMET', 'trio-outono': 'COMBO-TRIO-OUTONO',
};

const DRY = process.argv.includes('--dry');
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

const { products } = await admin(`{ products(first:100, query:"-status:archived"){ nodes{ id handle variants(first:1){ nodes{ id sku } } } } }`);
const unmapped = products.nodes.filter((p) => !SKU[p.handle]).map((p) => p.handle);
if (unmapped.length) console.warn('Sem SKU definido:', unmapped.join(', '));
for (const p of products.nodes.filter((p) => SKU[p.handle])) {
  const v = p.variants.nodes[0];
  console.log(`• ${p.handle}: ${v.sku || '—'} → ${SKU[p.handle]}`);
  if (DRY) continue;
  const d = await admin(`mutation($id:ID!,$v:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$id, variants:$v){ userErrors{ field message } } }`,
    { id: p.id, v: [{ id: v.id, inventoryItem: { sku: SKU[p.handle] } }] });
  if (d.productVariantsBulkUpdate.userErrors.length) throw new Error(JSON.stringify(d.productVariantsBulkUpdate.userErrors));
}
