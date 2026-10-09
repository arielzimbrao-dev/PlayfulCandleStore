// Substitui as fotos dos produtos pelas de public/fotos-playfulcandles/produtos/<pasta>/ (1 = principal)
// e cria os produtos que ainda não existem (como RASCUNHO — rever preço/stock e ativar no Admin).
// Uso: node scripts/sync-photos.mjs --dry   (mostra sem escrever)
//      node scripts/sync-photos.mjs         (aplica)
import { readFileSync, readdirSync, statSync } from 'node:fs';

const ROOT = new URL('../public/fotos-playfulcandles/produtos/', import.meta.url);

// pasta → handle existente na Shopify (só quando diferem).
const ALIAS = {
  'lemon-and-raspberry': 'lemon-raspberry',
  'orange-and-cinnamon': 'orange-cinnamon',
  'salted-caramel': 'salt-caramel',
  'waffles-and-berries': 'waffles-berries',
  'queimador-branco': 'queimador-grecia',
  'queimador-chiquissimo': 'queimador-dubai',
  'queimador-rosa': 'queimador-amsterda',
};

const COL = {
  snap: 'gid://shopify/Collection/671618826568',
  outono: 'gid://shopify/Collection/671619088712',
  queim: 'gid://shopify/Collection/671742853448',
};
// Produtos novos. ponytail: preços provisórios (combos = soma das peças) — confirmar antes de ativar.
const NEW = {
  'combo-gourmet': { title: 'Combo Gourmet', type: 'Combo', price: '25.00', cols: [COL.outono],
    html: '<p>🍂 <strong>Combo Gourmet</strong></p><p>Três mimos de outono numa só caixa: a vela de copo Cappuccino, o wax melt Cinnamon Rolls e a snapbar Salted Caramel. Cera de soja, feito à mão em Lisboa.</p>' },
  'trio-outono': { title: 'Trio Outono', type: 'Combo', price: '45.00', cols: [COL.outono],
    html: '<p>🍂 <strong>Trio Outono</strong></p><p>As três velas de copo da coleção de outono: Cappuccino, Pumpkin Spice e Orange & Cinnamon. 150g cada, cera de soja, feitas à mão em Lisboa.</p>' },
  'lemon-and-raspberry-snapbar': { title: 'Lemon & Raspberry Snapbar', type: 'Snapbar', price: '5.00', cols: [COL.snap],
    html: '<p>🍋 <strong>Snapbar Lemon & Raspberry</strong></p><p>A frescura do limão com o toque frutado da framboesa. Parte um quadradinho, põe no queimador e deixa o aroma espalhar-se. Cera de soja, feita à mão em Lisboa.</p>' },
  'orange-fruit': { title: 'Orange Fruit', type: 'Snapbar', price: '5.00', cols: [COL.snap],
    html: '<p>🍊 <strong>Snapbar Orange Fruit</strong></p><p>Laranja suculenta e solarenga para dar energia à casa. Parte um quadradinho, põe no queimador e deixa o aroma espalhar-se. Cera de soja, feita à mão em Lisboa.</p>' },
  'queimador-chiquissimo': { title: 'Queimador Dubai', type: 'Queimador', price: '5.00', cols: [COL.queim],
    html: '<p>🕯️ <strong>Queimador de wax melts</strong></p><p>Estrutura geométrica dourada com taça de cerâmica branca: aquece as tuas pastilhas de cera e liberta o aroma aos poucos, sem chama direta na cera. Basta uma vela de chá (tealight) por baixo.</p>' },
  'queimador-rosa': { title: 'Queimador Amsterdã', type: 'Queimador', price: '5.00', cols: [COL.queim],
    html: '<p>🕯️ <strong>Queimador de wax melts</strong></p><p>Queimador em cerâmica rosa com relevo de arcos: aquece as tuas pastilhas de cera e liberta o aroma aos poucos, sem chama direta na cera. Basta uma vela de chá (tealight) por baixo.</p>' },
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

const { products } = await admin(`{ products(first:100){ nodes{ id handle title media(first:50){ nodes{ id } } } } }`);
const byHandle = new Map(products.nodes.map((p) => [p.handle, p]));
const { publications } = await admin(`{ publications(first:10){ nodes{ id } } }`);

// Sobe um ficheiro local para o storage da Shopify e devolve o resourceUrl.
async function stage(path, name) {
  const buf = readFileSync(path);
  const d = await admin(`mutation($i:[StagedUploadInput!]!){ stagedUploadsCreate(input:$i){ stagedTargets{ url resourceUrl parameters{ name value } } userErrors{ message } } }`,
    { i: [{ filename: name, mimeType: 'image/jpeg', resource: 'IMAGE', httpMethod: 'POST', fileSize: String(buf.length) }] });
  check('staged', d.stagedUploadsCreate.userErrors);
  const t = d.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of t.parameters) form.append(p.name, p.value);
  form.append('file', new Blob([buf], { type: 'image/jpeg' }), name);
  const r = await fetch(t.url, { method: 'POST', body: form });
  if (!r.ok) throw new Error(`upload ${name}: ${r.status} ${await r.text()}`);
  return t.resourceUrl;
}

for (const folder of readdirSync(ROOT).filter((f) => statSync(new URL(f, ROOT)).isDirectory()).sort()) {
  const files = readdirSync(new URL(`${folder}/`, ROOT))
    .filter((f) => /\.(jpe?g)$/i.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));
  const handle = ALIAS[folder] ?? folder;
  const existing = byHandle.get(handle);
  const spec = NEW[folder];
  if (!existing && !spec) { console.warn(`! ${folder}: sem produto nem definição — ignorado`); continue; }
  const title = existing?.title ?? spec.title;
  console.log(`• ${folder} → ${existing ? `ATUALIZA ${handle}` : `CRIA ${title} (rascunho)`} · ${files.join(', ')}${existing ? ` · remove ${existing.media.nodes.length} foto(s) antiga(s)` : ''}`);
  if (DRY) continue;

  const media = [];
  for (const [i, f] of files.entries()) {
    media.push({
      originalSource: await stage(new URL(`${folder}/${f}`, ROOT), `${folder}-${f.toLowerCase()}`),
      mediaContentType: 'IMAGE',
      alt: i === 0 ? `${title} — Playful Candles` : `${title} — Playful Candles, foto ${i + 1}`,
    });
  }

  if (existing) {
    // Novas primeiro, só depois apaga as antigas — se algo falhar o produto nunca fica sem foto.
    const u = await admin(`mutation($p:ProductUpdateInput!,$m:[CreateMediaInput!]){ productUpdate(product:$p, media:$m){ userErrors{ field message } } }`,
      { p: { id: existing.id }, m: media });
    check('productUpdate', u.productUpdate.userErrors);
    const old = existing.media.nodes.map((n) => n.id);
    if (old.length) {
      const d = await admin(`mutation($id:ID!,$m:[ID!]!){ productDeleteMedia(productId:$id, mediaIds:$m){ mediaUserErrors{ message } } }`, { id: existing.id, m: old });
      check('productDeleteMedia', d.productDeleteMedia.mediaUserErrors);
    }
  } else {
    const c = await admin(`mutation($p:ProductCreateInput!,$m:[CreateMediaInput!]){ productCreate(product:$p, media:$m){ product{ id variants(first:1){ nodes{ id } } } userErrors{ field message } } }`,
      { p: { title, handle, productType: spec.type, vendor: 'PlayfulCandles', status: 'DRAFT', descriptionHtml: spec.html, collectionsToJoin: spec.cols }, m: media });
    check('productCreate', c.productCreate.userErrors);
    const p = c.productCreate.product;
    const v = await admin(`mutation($id:ID!,$v:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$id, variants:$v){ userErrors{ message } } }`,
      { id: p.id, v: [{ id: p.variants.nodes[0].id, price: spec.price }] });
    check('price', v.productVariantsBulkUpdate.userErrors);
    const pub = await admin(`mutation($id:ID!,$i:[PublicationInput!]!){ publishablePublish(id:$id, input:$i){ userErrors{ message } } }`,
      { id: p.id, i: publications.nodes.map((n) => ({ publicationId: n.id })) });
    check('publish', pub.publishablePublish.userErrors);
  }
  console.log('    ok');
}
