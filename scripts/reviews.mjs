// Gestão de reviews (metafield custom.reviews) via Admin API.
// Uso:
//   node scripts/reviews.mjs list <handle>
//   node scripts/reviews.mjs add <handle> "Nome" <1-5> "Comentário"   (adiciona já aprovada + verificada)
//   node scripts/reviews.mjs approve <handle>                          (aprova todas as pendentes)
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const dom = env.SHOPIFY_STORE_DOMAIN;
async function token() {
  const r = await fetch(`https://${dom}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET }) });
  const j = await r.json(); if (!j.access_token) throw new Error('sem token: ' + JSON.stringify(j)); return j.access_token;
}
const tok = await token();
const admin = (query, variables) => fetch(`https://${dom}/admin/api/2026-07/graphql.json`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': tok }, body: JSON.stringify({ query, variables }) }).then((r) => r.json());

const [cmd, handle, ...rest] = process.argv.slice(2);
if (!cmd || !handle) { console.log('uso: list <handle> | add <handle> "Nome" <1-5> "texto" | approve <handle>'); process.exit(1); }

const pd = await admin(`query($h:String!){ productByHandle(handle:$h){ id title metafield(namespace:"custom",key:"reviews"){ value } } }`, { h: handle });
const product = pd.data?.productByHandle;
if (!product) { console.error('produto não encontrado:', handle); process.exit(1); }
let list = [];
try { const v = JSON.parse(product.metafield?.value || '[]'); list = Array.isArray(v) ? v : (v.items || []); } catch { list = []; }

async function save() {
  const r = await admin(`mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ userErrors{ message } } }`, { m: [{ ownerId: product.id, namespace: 'custom', key: 'reviews', type: 'json', value: JSON.stringify(list) }] });
  const e = r.errors ?? r.data?.metafieldsSet?.userErrors ?? []; if (e.length) { console.error(JSON.stringify(e)); process.exit(1); }
}

if (cmd === 'list') {
  console.log(`${product.title} — ${list.length} review(s):`);
  list.forEach((r, i) => console.log(`  [${i}] ${r.approved === false ? 'PENDENTE' : 'aprovada'} · ${r.rating}★ · ${r.author}: ${String(r.text).slice(0, 60)}`));
} else if (cmd === 'add') {
  const [author, rating, text] = rest;
  list.push({ author: author || 'Cliente', rating: Math.max(1, Math.min(5, Math.round(Number(rating)))), text: text || '', date: new Date().toISOString(), verified: true, approved: true });
  await save(); console.log('✓ adicionada e aprovada. Total:', list.length);
} else if (cmd === 'approve') {
  let n = 0; list = list.map((r) => { if (r.approved === false) { n++; return { ...r, approved: true }; } return r; });
  await save(); console.log(`✓ ${n} aprovada(s).`);
} else { console.log('comando inválido'); }
