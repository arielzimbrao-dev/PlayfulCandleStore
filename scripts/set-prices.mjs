// Preço e peso de envio por tipo de produto (Out 2026).
// Uso: node scripts/set-prices.mjs --dry  |  node scripts/set-prices.mjs
import { readFileSync } from 'node:fs';

const VELAS_15 = new Set(['cappuccino', 'orange-cinnamon', 'pumpkin-spice']);
const BY_TYPE = { 'Wax Melt': ['9.00', 100], Snapbar: ['5.00', 50], Queimador: ['5.00'] };
const OVERRIDE = {
  'queimador-dubai': ['10.00', 260],
  'queimador-grecia': ['5.00', 240],
  'queimador-amsterda': ['5.00', 290],
  'combo-gourmet': ['29.00', 300], // vela 15 + wax melt 9 + snapbar 5
  'trio-outono': ['45.00', 450], // 3 velas de 15
};
const rule = (p) => OVERRIDE[p.handle]
  ?? (p.productType === 'Vela' ? [VELAS_15.has(p.handle) ? '15.00' : '13.00', 150] : BY_TYPE[p.productType]);

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

const { products } = await admin(`{ products(first:100, query:"-status:archived"){ nodes{ id handle productType variants(first:10){ nodes{ id price } } } } }`);
for (const p of products.nodes) {
  const r = rule(p);
  if (!r) { console.log(`  ${p.handle} (${p.productType}) — sem regra, inalterado`); continue; }
  const [price, grams] = r;
  console.log(`• ${p.handle}: ${p.variants.nodes[0].price} → ${price} €${grams ? ` · ${grams} g` : ""}`);
  if (DRY) continue;
  const d = await admin(`mutation($id:ID!,$v:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$id, variants:$v){ userErrors{ field message } } }`, {
    id: p.id,
    v: p.variants.nodes.map((v) => ({ id: v.id, price, ...(grams && { inventoryItem: { measurement: { weight: { value: grams, unit: "GRAMS" } } } }) })),
  });
  if (d.productVariantsBulkUpdate.userErrors.length) throw new Error(JSON.stringify(d.productVariantsBulkUpdate.userErrors));
}
