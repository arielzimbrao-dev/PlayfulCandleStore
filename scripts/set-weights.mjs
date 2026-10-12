// Peso (g) por tipo de produto — é o que a Shopify usa para calcular os portes por escalão de kg.
// Uso: node scripts/set-weights.mjs --dry  |  node scripts/set-weights.mjs
// O tipo vem do productType, com a mesma regra de lib/filters.ts (productCategory).
import { readFileSync } from 'node:fs';

const GRAMS = { velas: 430, wax: 125, snap: 60 }; // packs ficam como estão
// Queimadores têm pesos diferentes entre si: peso por handle (tem prioridade sobre o tipo).
const BY_HANDLE = { 'queimador-dubai': 170, 'queimador-grecia': 250, 'queimador-amsterda': 305 };

const category = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('pack')) return 'pack';
  if (t.includes('snap')) return 'snap';
  if (t.includes('wax') || t.includes('melt')) return 'wax';
  if (t.includes('queim') || t.includes('burner')) return 'burner';
  if (t.includes('vela') || t.includes('candle') || t.includes('copo')) return 'velas';
  return null;
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

const { products } = await admin(`{ products(first:100, query:"-status:archived"){ nodes{ id handle productType
  variants(first:20){ nodes{ id inventoryItem{ measurement{ weight{ value unit } } } } } } } }`);
for (const p of products.nodes) {
  const grams = BY_HANDLE[p.handle] ?? GRAMS[category(p.productType)];
  if (!grams) { console.log(`· ${p.handle} (${p.productType || 'sem tipo'}): mantém`); continue; }
  const now = p.variants.nodes[0]?.inventoryItem.measurement.weight;
  console.log(`• ${p.handle} (${p.productType}): ${now?.value} ${now?.unit} → ${grams} g`);
  if (DRY) continue;
  const d = await admin(`mutation($id:ID!,$v:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$id, variants:$v){ userErrors{ field message } } }`,
    { id: p.id, v: p.variants.nodes.map((v) => ({ id: v.id, inventoryItem: { measurement: { weight: { value: grams, unit: 'GRAMS' } } } })) });
  if (d.productVariantsBulkUpdate.userErrors.length) throw new Error(JSON.stringify(d.productVariantsBulkUpdate.userErrors));
}
