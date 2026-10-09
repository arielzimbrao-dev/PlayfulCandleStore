// Aplica descrição SEO, SEO title/description e alt de cada foto (por ordem: 1.JPG, 2.JPG…) a partir de scripts/product-copy.json.
// Uso: node scripts/apply-copy.mjs --dry   (valida sem escrever)
//      node scripts/apply-copy.mjs         (aplica)
import { readFileSync } from 'node:fs';

const COPY = JSON.parse(readFileSync(new URL('./product-copy.json', import.meta.url), 'utf8'));
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
if (!tk.access_token) { console.error('Sem token:', JSON.stringify(tk).slice(0, 200)); process.exit(1); }
const admin = async (query, variables = {}) => {
  const j = await (await fetch(`https://${dom}/admin/api/2026-07/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': tk.access_token },
    body: JSON.stringify({ query, variables }),
  })).json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
};
const check = (label, errs) => { if (errs?.length) throw new Error(`${label}: ${JSON.stringify(errs)}`); };

const { products } = await admin(`{ products(first:100){ nodes{ id handle media(first:50){ nodes{ id } } } } }`);
const byHandle = new Map(products.nodes.map((p) => [p.handle, p]));

let bad = 0;
for (const [folder, c] of Object.entries(COPY)) {
  const p = byHandle.get(c.handle);
  const media = p?.media.nodes ?? [];
  const warn = [];
  if (!p) warn.push('produto não existe');
  if (p && media.length !== c.alts.length) warn.push(`${media.length} fotos ≠ ${c.alts.length} alts`);
  if (c.seoTitle.length > 70) warn.push(`seoTitle ${c.seoTitle.length}c`);
  if (c.seoDescription.length > 160) warn.push(`seoDescription ${c.seoDescription.length}c`);
  console.log(`• ${folder} → ${c.handle}${warn.length ? `  ⚠ ${warn.join('; ')}` : ''}`);
  if (warn.length) { bad++; continue; }
  if (DRY) continue;

  const u = await admin(`mutation($p:ProductUpdateInput!){ productUpdate(product:$p){ userErrors{ field message } } }`,
    { p: { id: p.id, descriptionHtml: c.descriptionHtml, seo: { title: c.seoTitle, description: c.seoDescription } } });
  check('productUpdate', u.productUpdate.userErrors);
  const m = await admin(`mutation($id:ID!,$m:[UpdateMediaInput!]!){ productUpdateMedia(productId:$id, media:$m){ mediaUserErrors{ message } } }`,
    { id: p.id, m: media.map((n, i) => ({ id: n.id, alt: c.alts[i] })) });
  check('productUpdateMedia', m.productUpdateMedia.mediaUserErrors);
}
if (bad) { console.error(`${bad} produto(s) com avisos — não aplicados.`); process.exit(1); }
