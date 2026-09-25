// Preenche SEO description (todos) e alt text das imagens (as que existem) via Admin API.
// Uso: node scripts/enrich-products.mjs --dry   (mostra sem escrever)
//      node scripts/enrich-products.mjs         (aplica)
// Auth: client_credentials (SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET) ou SHOPIFY_ADMIN_API_TOKEN.
import { readFileSync } from 'node:fs';

// Copy PT-PT, on-brand (vela de copo/snapbar/wax melt · cera vegetal · feito à mão em Lisboa).
// seo ~150-160 chars. alt só para produtos com imagem.
const CONTENT = {
  'Purple Vanilla':    { seo: 'Vela de copo Purple Vanilla: aroma doce e cremoso de baunilha para acolher a casa. Cera vegetal, feita à mão em Lisboa pela Playful Candles.', alt: 'Vela de copo aromática Purple Vanilla, aroma doce de baunilha — Playful Candles' },
  'Passion Fruit':     { seo: 'Vela de copo Passion Fruit: explosão tropical e cítrica de maracujá que ilumina o espaço. Cera vegetal, feita à mão em Lisboa pela Playful Candles.', alt: 'Vela de copo aromática Passion Fruit, aroma tropical de maracujá — Playful Candles' },
  'Sea Breeze':        { seo: 'Vela de copo Sea Breeze: brisa marinha fresca e limpa que traz calma à casa. Cera vegetal, feita à mão em Lisboa pela Playful Candles.', alt: 'Vela de copo aromática Sea Breeze, aroma fresco de brisa marinha — Playful Candles' },
  'Lemon & Raspberry': { seo: 'Vela de copo Lemon & Raspberry: a frescura do limão com o toque frutado da framboesa. Cera vegetal, feita à mão em Lisboa pela Playful Candles.', alt: 'Vela de copo aromática Lemon & Raspberry, aroma de limão e framboesa — Playful Candles' },
  'Floral Explosion':  { seo: 'Vela de copo Floral Explosion: bouquet floral exuberante e sofisticado para perfumar a casa. Cera vegetal, feita à mão em Lisboa pela Playful Candles.', alt: 'Vela de copo aromática Floral Explosion, aroma floral intenso — Playful Candles' },
  'Cotton Flower':     { seo: 'Vela de copo Cotton Flower: o conforto suave de roupa lavada ao sol, limpo e acolhedor. Cera vegetal, feita à mão em Lisboa pela Playful Candles.', alt: 'Vela de copo aromática Cotton Flower, aroma limpo de flor de algodão — Playful Candles' },
  'Cappuccino':        { seo: 'Vela de copo Cappuccino: aroma cremoso e quente de café acabado de fazer. Cera vegetal, feita à mão em Lisboa pela Playful Candles.' },
  'Orange & Cinnamon': { seo: 'Vela de copo Orange & Cinnamon: laranja vibrante com o calor especiado da canela. Cera vegetal, feita à mão em Lisboa pela Playful Candles.' },
  'Pumpkin Spice':     { seo: 'Vela de copo Pumpkin Spice: abóbora e especiarias para o mood aconchegante de outono. Cera vegetal, feita à mão em Lisboa pela Playful Candles.' },
  'Dama da Noite':     { seo: 'Snapbar Dama da Noite: aroma floral intenso e sedutor que desabrocha ao anoitecer. Cera vegetal, feita à mão em Lisboa pela Playful Candles.', alt: 'Snapbar aromática Dama da Noite, aroma floral nocturno — Playful Candles' },
  'Cappuccino Break':  { seo: 'Snapbar Cappuccino Break: o aroma cremoso de café para a pausa mais reconfortante do dia. Cera vegetal, feita à mão em Lisboa pela Playful Candles.', alt: 'Snapbar aromática Cappuccino Break, aroma de café cremoso — Playful Candles' },
  'Sweet Strawberry':  { seo: 'Snapbar Sweet Strawberry: doçura vibrante de morango que enche o ambiente de energia. Cera vegetal, feita à mão em Lisboa pela Playful Candles.', alt: 'Snapbar aromática Sweet Strawberry, aroma doce de morango — Playful Candles' },
  'Maçã do amor':      { seo: 'Snapbar Maçã do Amor: maçã crocante com a doçura festiva do caramelo. Cera vegetal, feita à mão em Lisboa pela Playful Candles.' },
  'Salt Caramel':      { seo: 'Snapbar Salt Caramel: caramelo cremoso com um toque de sal, doce e sofisticado. Cera vegetal, feita à mão em Lisboa pela Playful Candles.' },
  'Under the Sea':     { seo: 'Wax melt Under the Sea: notas marinhas frescas e limpas para purificar o ambiente. Cera vegetal, feito à mão em Lisboa pela Playful Candles.' },
  'Waffles & Berries': { seo: 'Wax melt Waffles & Berries: waffles cremosos com frutos vermelhos, doce e irresistível. Cera vegetal, feito à mão em Lisboa pela Playful Candles.' },
  'Cinnamon Rolls':    { seo: 'Wax melt Cinnamon Rolls: o aroma quente de rolos de canela acabados de sair do forno. Cera vegetal, feito à mão em Lisboa pela Playful Candles.' },
  'Queimador Branco':  { seo: 'Queimador de wax melts branco da Playful Candles: aquece as pastilhas de cera e liberta o aroma aos poucos. Design minimalista, feito para durar.' },
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
  const r = await fetch(`https://${dom}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET }),
  });
  const j = await r.json();
  if (!j.access_token || !/write_products/.test(j.scope || '')) { console.error('Sem token/scope write_products:', JSON.stringify(j).slice(0, 200)); process.exit(1); }
  return j.access_token;
}
const tok = await getToken();
const admin = (query, variables = {}) =>
  fetch(`https://${dom}/admin/api/2026-07/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': tok },
    body: JSON.stringify({ query, variables }),
  }).then((r) => r.json());

// Buscar id + primeira imagem de cada produto.
const data = await admin(`query{ products(first:100){ nodes{ id title media(first:1){ nodes{ ... on MediaImage { id } } } } } }`);
if (data.errors) { console.error(JSON.stringify(data.errors)); process.exit(1); }
const byTitle = new Map(data.data.products.nodes.map((p) => [p.title, p]));

const UPDATE = `mutation($input:ProductInput!){ productUpdate(input:$input){ product{ id } userErrors{ field message } } }`;
const MEDIA = `mutation($productId:ID!,$media:[UpdateMediaInput!]!){ productUpdateMedia(productId:$productId,media:$media){ mediaUserErrors{ field message } } }`;

let seoN = 0, altN = 0, miss = [];
for (const [title, c] of Object.entries(CONTENT)) {
  const p = byTitle.get(title);
  if (!p) { miss.push(title); continue; }
  const mediaId = p.media.nodes[0]?.id;
  console.log(`• ${title}`);
  console.log(`    SEO: ${c.seo}`);
  if (c.alt) console.log(`    ALT${mediaId ? '' : ' (sem imagem — ignorado)'}: ${c.alt}`);
  if (DRY) { seoN++; if (c.alt && mediaId) altN++; continue; }

  const u = await admin(UPDATE, { input: { id: p.id, seo: { description: c.seo } } });
  const ue = u.errors ?? u.data?.productUpdate?.userErrors ?? [];
  if (ue.length) { console.error('  SEO erro:', JSON.stringify(ue)); process.exit(1); }
  seoN++;

  if (c.alt && mediaId) {
    const m = await admin(MEDIA, { productId: p.id, media: [{ id: mediaId, alt: c.alt }] });
    const me = m.errors ?? m.data?.productUpdateMedia?.mediaUserErrors ?? [];
    if (me.length) { console.error('  ALT erro:', JSON.stringify(me)); process.exit(1); }
    altN++;
  }
}
if (miss.length) console.warn('⚠ Não encontrados:', miss.join(', '));
console.log(`\n${DRY ? '[dry] ' : ''}SEO: ${seoN} produtos · ALT: ${altN} imagens${DRY ? ' (nada escrito)' : ' escritos'}`);
