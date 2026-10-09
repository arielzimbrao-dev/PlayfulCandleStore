// Define o stock "disponível" (contagem física) na única localização da loja. Ativa tracking se faltar.
// Uso: node scripts/set-stock.mjs --dry  |  node scripts/set-stock.mjs
import { readFileSync } from 'node:fs';

const STOCK = {
  'queimador-dubai': 3, 'queimador-grecia': 1, 'queimador-amsterda': 1,
  cappuccino: 2, 'orange-cinnamon': 3, 'pumpkin-spice': 3, 'passion-fruit': 1, 'lemon-raspberry': 1,
  'sea-breeze': 2, 'cotton-flower': 2, 'purple-vanilla': 2,
  'dama-da-noite': 4, 'sweet-strawberry': 4, 'cappuccino-break': 3, 'orange-fruit': 2,
  'lemon-and-raspberry-snapbar': 9, 'maca-do-amor': 10, 'salt-caramel': 9,
  'under-the-sea': 3, 'cinnamon-rolls': 4, 'waffles-berries': 2,
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
const check = (label, errs) => { if (errs?.length) throw new Error(`${label}: ${JSON.stringify(errs)}`); };

const { locations, products } = await admin(`{
  locations(first:1){ nodes{ id } }
  products(first:100){ nodes{ handle variants(first:1){ nodes{ inventoryItem{ id tracked
    inventoryLevels(first:1){ nodes{ quantities(names:["available"]){ quantity } } } } } } } }
}`);
const locationId = locations.nodes[0].id;
const byHandle = new Map(products.nodes.map((p) => [p.handle, p.variants.nodes[0].inventoryItem]));

const missing = Object.keys(STOCK).filter((h) => !byHandle.has(h));
if (missing.length) { console.error('Handles inexistentes:', missing.join(', ')); process.exit(1); }

const quantities = [];
for (const [handle, quantity] of Object.entries(STOCK)) {
  const item = byHandle.get(handle);
  const current = item.inventoryLevels.nodes[0]?.quantities[0]?.quantity ?? 0;
  console.log(`• ${handle}: ${current} → ${quantity}${item.tracked ? '' : ' (ativa tracking)'}`);
  if (!DRY && !item.tracked) {
    const u = await admin(`mutation($id:ID!){ inventoryItemUpdate(id:$id, input:{ tracked:true }){ userErrors{ message } } }`, { id: item.id });
    check('tracked', u.inventoryItemUpdate.userErrors);
  }
  quantities.push({ inventoryItemId: item.id, locationId, quantity, changeFromQuantity: current });
}
if (DRY) process.exit(0);
const s = await admin(`mutation($i:InventorySetQuantitiesInput!, $k:String!){ inventorySetQuantities(input:$i) @idempotent(key: $k){ userErrors{ field message } } }`,
  { k: crypto.randomUUID(), i: { name: 'available', reason: 'correction', referenceDocumentUri: 'playfulcandles://contagem-stock', quantities } });
check('inventorySetQuantities', s.inventorySetQuantities.userErrors);
console.log(`ok — ${quantities.length} produtos`);
