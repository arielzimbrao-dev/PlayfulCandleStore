// Correção PT-PT das descrições de produto (cirúrgica: só onde há PT-BR ou trato formal).
// Uso: node scripts/fix-desc.mjs --dry | node scripts/fix-desc.mjs
import { readFileSync } from 'node:fs';

// title -> [[de, para], ...]  (substituição exata no descriptionHtml)
const REPLACEMENTS = {
  'Purple Vanilla':    [['Adoce os seus dias', 'Adoça os teus dias']],
  'Lemon & Raspberry': [['seu design lúdico transforma a vela em um verdadeiro elemento de decoração', 'o seu design lúdico transforma-a num verdadeiro elemento de decoração']],
  'Sweet Strawberry':  [['que nos transporta direto para os dias', 'que nos transporta diretamente para os dias']],
  'Under the Sea':     [['notas marinhas e acuáticas', 'notas marinhas e aquáticas']],
  'Cinnamon Rolls':    [['de rolinhos de canela recém-saídos do forno', 'de rolos de canela acabados de sair do forno']],
};
// Descrição nova para produtos sem descrição (PT-PT informal).
const NEW = {
  'Queimador Branco': '<p>🕯️ <strong>Queimador de wax melts</strong></p>\n<p>O queimador branco da Playful Candles aquece as tuas pastilhas de cera e liberta o aroma aos poucos — sem chama direta na cera. O design minimalista combina com qualquer decoração. Basta pores uma vela de chá (tealight) por baixo e deixares o aroma envolver a casa.</p>',
};

const DRY = process.argv.includes('--dry');
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const dom = env.SHOPIFY_STORE_DOMAIN;
async function getToken() {
  if (env.SHOPIFY_ADMIN_API_TOKEN) return env.SHOPIFY_ADMIN_API_TOKEN;
  const r = await fetch(`https://${dom}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET }) });
  const j = await r.json();
  if (!j.access_token) { console.error('Sem token:', JSON.stringify(j).slice(0, 200)); process.exit(1); }
  return j.access_token;
}
const tok = await getToken();
const admin = (query, variables = {}) => fetch(`https://${dom}/admin/api/2026-07/graphql.json`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': tok }, body: JSON.stringify({ query, variables }) }).then((r) => r.json());

const data = await admin(`query{ products(first:100){ nodes{ id title descriptionHtml } } }`);
const byTitle = new Map(data.data.products.nodes.map((p) => [p.title, p]));
const UPDATE = `mutation($input:ProductInput!){ productUpdate(input:$input){ product{ id } userErrors{ field message } } }`;

const jobs = [];
for (const [title, reps] of Object.entries(REPLACEMENTS)) {
  const p = byTitle.get(title); if (!p) { console.warn('⚠ não encontrado:', title); continue; }
  let html = p.descriptionHtml;
  for (const [from, to] of reps) {
    if (!html.includes(from)) { console.error(`✗ ${title}: texto não encontrado → "${from}"`); process.exit(1); }
    html = html.replace(from, to);
  }
  jobs.push({ title, id: p.id, html, note: reps.map((r) => `"${r[0]}" → "${r[1]}"`).join('; ') });
}
for (const [title, html] of Object.entries(NEW)) {
  const p = byTitle.get(title); if (!p) { console.warn('⚠ não encontrado:', title); continue; }
  if ((p.descriptionHtml || '').trim()) { console.log(`· ${title}: já tem descrição — ignorado`); continue; }
  jobs.push({ title, id: p.id, html, note: '(descrição nova)' });
}

for (const j of jobs) {
  console.log(`• ${j.title}: ${j.note}`);
  if (DRY) continue;
  const u = await admin(UPDATE, { input: { id: j.id, descriptionHtml: j.html } });
  const ue = u.errors ?? u.data?.productUpdate?.userErrors ?? [];
  if (ue.length) { console.error('  erro:', JSON.stringify(ue)); process.exit(1); }
}
console.log(`\n${DRY ? '[dry] ' : ''}${jobs.length} descrições ${DRY ? 'a corrigir (nada escrito)' : 'atualizadas'}`);
