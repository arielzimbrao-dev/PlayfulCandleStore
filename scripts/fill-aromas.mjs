// Preenche o metacampo custom.aromas (list.single_line_text_field) em massa via Admin API.
// Uso: node scripts/fill-aromas.mjs         (aplica)
//      node scripts/fill-aromas.mjs --dry    (só mostra o que faria)
// Precisa de SHOPIFY_ADMIN_API_TOKEN no .env.local (custom app, escopo write_products).
import { readFileSync } from 'node:fs';

// ── Mapa produto → aromas. Edita à vontade; produtos fora deste mapa não são tocados. ──
// Valores válidos: Cítrico · Doce · Floral · Fresco · Frutado · Gourmand
const AROMAS = {
  'Cappuccino': ['Gourmand', 'Doce'],
  'Orange & Cinnamon': ['Cítrico', 'Gourmand'],
  'Pumpkin Spice': ['Gourmand', 'Doce'],
  'Dama da Noite': ['Floral'],
  'Cappuccino Break': ['Gourmand', 'Doce'],
  'Sweet Strawberry': ['Frutado', 'Doce'],
  'Maçã do amor': ['Frutado', 'Doce'],
  'Salt Caramel': ['Gourmand', 'Doce'],
  'Under the Sea': ['Fresco'],
  'Waffles & Berries': ['Doce', 'Frutado', 'Gourmand'],
  'Cinnamon Rolls': ['Gourmand', 'Doce'],
  // 'Queimador Branco' é queimador (sem aroma) — deixado de fora de propósito.
};

const DRY = process.argv.includes('--dry');
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const dom = env.SHOPIFY_STORE_DOMAIN;
if (!dom) { console.error('Falta SHOPIFY_STORE_DOMAIN no .env.local'); process.exit(1); }

// Token: usa SHOPIFY_ADMIN_API_TOKEN se existir; senão faz client_credentials grant
// (apps do Dev Dashboard) a partir de SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET.
async function getToken() {
  if (env.SHOPIFY_ADMIN_API_TOKEN) return env.SHOPIFY_ADMIN_API_TOKEN;
  const id = env.SHOPIFY_CLIENT_ID, secret = env.SHOPIFY_CLIENT_SECRET;
  if (!id || !secret) { console.error('Falta SHOPIFY_ADMIN_API_TOKEN, ou SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET no .env.local'); process.exit(1); }
  const r = await fetch(`https://${dom}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
  });
  const j = await r.json();
  if (!j.access_token) { console.error('Falha no client_credentials grant:', JSON.stringify(j)); process.exit(1); }
  console.log('Scopes concedidos:', j.scope || '(nenhum)');
  if (!/write_products/.test(j.scope || '')) {
    console.error('\n⛔ Falta o scope write_products. No Dev Dashboard: Versions → New version → adiciona Admin API scope "write_products" → Release → reinstala. Depois corre de novo.');
    process.exit(1);
  }
  return j.access_token;
}
const tok = await getToken();

const admin = (query, variables = {}) =>
  fetch(`https://${dom}/admin/api/2026-07/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': tok },
    body: JSON.stringify({ query, variables }),
  }).then((r) => r.json());

// 1. Buscar id + title de todos os produtos (paginado).
async function allProducts() {
  const out = []; let cursor = null;
  do {
    const d = await admin(
      `query($c:String){ products(first:100, after:$c){ nodes{ id title } pageInfo{ hasNextPage endCursor } } }`,
      { c: cursor },
    );
    if (d.errors) throw new Error(JSON.stringify(d.errors));
    out.push(...d.data.products.nodes);
    const pi = d.data.products.pageInfo;
    cursor = pi.hasNextPage ? pi.endCursor : null;
  } while (cursor);
  return out;
}

const products = await allProducts();
const byTitle = new Map(products.map((p) => [p.title, p.id]));

const metafields = [];
const missing = [];
for (const [title, aromas] of Object.entries(AROMAS)) {
  const id = byTitle.get(title);
  if (!id) { missing.push(title); continue; }
  metafields.push({ ownerId: id, namespace: 'custom', key: 'aromas', type: 'list.single_line_text_field', value: JSON.stringify(aromas) });
}

if (missing.length) console.warn('⚠ Produtos não encontrados pelo título (verifica a grafia):', missing.join(', '));
console.log(`${metafields.length} produto(s) a preencher${DRY ? ' (dry-run)' : ''}:`);
for (const m of metafields) console.log('  •', products.find((p) => p.id === m.ownerId).title, '→', JSON.parse(m.value).join(', '));
if (DRY) { console.log('\nDry-run: nada foi escrito.'); process.exit(0); }

// 2. metafieldsSet aceita até 25 por chamada.
const SET = `mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ metafields{ id } userErrors{ field message } } }`;
for (let i = 0; i < metafields.length; i += 25) {
  const batch = metafields.slice(i, i + 25);
  const d = await admin(SET, { m: batch });
  const errs = d.errors ?? d.data?.metafieldsSet?.userErrors ?? [];
  if (errs.length) { console.error('Erro no lote', i / 25, JSON.stringify(errs)); process.exit(1); }
  console.log(`✓ Lote ${i / 25 + 1}: ${d.data.metafieldsSet.metafields.length} metacampos escritos`);
}
console.log('Feito. Recarrega as páginas de coleção — o filtro de aromas deve aparecer.');
