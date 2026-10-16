// Packs como produtos reais (out 2026). Uso: node scripts/create-packs.mjs --dry  |  node scripts/create-packs.mjs
// - Trio Outono: bundle nativo (composição fixa → o stock desconta das 3 velas). Reaproveita o produto trio-outono.
// - Packs de escolha: produto com preço próprio, inventário sem tracking; o que o cliente escolhe vai
//   como propriedades da linha do carrinho. As regras de escolha ficam no metafield custom.pack_slots
//   (JSON, editável no admin): [{ "label", "type": velas|wax|snap|burner, "collection"?, "handles"? }].
// - Desativa os descontos por código "Pack…" (o site deixa de os aplicar).
// Fotos: só imagens que já estão na Shopify (de outros produtos), escolhidas por handle + posição.
import { readFileSync } from 'node:fs';

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

const CANDLES = 'gid://shopify/TaxonomyCategory/hg-3-40-2';
const OUTONO = 'colecao-de-outono';

const PACKS = [
  {
    handle: 'trio-outono', title: 'Trio Outono', sku: 'PK-01', price: '35.00', grams: 1290,
    bundle: ['cappuccino', 'pumpkin-spice', 'orange-cinnamon'],
    photos: [['trio-outono', 0]],
    collections: [OUTONO],
    seoTitle: 'Trio Outono · Pack de 3 velas aromáticas | Playful Candles',
    seoDescription: 'As 3 velas da Coleção de Outono num pack: Cappuccino, Pumpkin Spice e Orange & Cinnamon. Feitas à mão em Lisboa, prontas a oferecer.',
    descriptionHtml: '<p>As três velas da Coleção de Outono num só pack: <strong>Cappuccino</strong>, <strong>Pumpkin Spice</strong> e <strong>Orange &amp; Cinnamon</strong>. Café acabado de fazer, abóbora com especiarias e laranja com canela, para teres o outono em cada canto da casa.</p><p>Feitas à mão em Lisboa, com cera vegetal. Um presente pronto a oferecer (ou a guardar para ti).</p>',
  },
  {
    handle: 'pack-outono', title: 'Pack Outono', sku: 'PK-02', price: '24.00', grams: 615,
    slots: [
      { label: 'Vela', type: 'velas', collection: OUTONO },
      { label: 'Wax Melt', type: 'wax', collection: OUTONO },
      { label: 'Snapbar', type: 'snap', collection: OUTONO },
    ],
    photos: [['combo-gourmet', 0], ['orange-cinnamon', 0], ['waffles-berries', 1], ['salt-caramel', 0]],
    collections: [OUTONO],
    seoTitle: 'Pack Outono · Vela, wax melt e snapbar à escolha | Playful Candles',
    seoDescription: 'Monta o teu pack de outono: escolhe 1 vela, 1 wax melt e 1 snapbar da Coleção de Outono. Feitos à mão em Lisboa.',
    descriptionHtml: '<p>Monta o teu outono: escolhes <strong>1 vela</strong>, <strong>1 wax melt</strong> e <strong>1 snapbar</strong> da Coleção de Outono, e nós juntamos tudo num pack.</p><p>A forma mais fácil de experimentar os três formatos com os aromas da estação.</p>',
  },
  {
    handle: 'pack-starter-wax', title: 'Pack Starter Wax', sku: 'PK-03', price: '16.00', grams: 490,
    slots: [
      { label: 'Queimador', type: 'burner', handles: ['queimador-grecia', 'queimador-amsterda'] },
      { label: 'Wax Melt', type: 'wax' },
      { label: 'Snapbar', type: 'snap' },
    ],
    photos: [['queimador-grecia', 0], ['cinnamon-rolls', 1], ['queimador-amsterda', 0], ['lemon-and-raspberry-snapbar', 1]],
    collections: [],
    seoTitle: 'Pack Starter Wax · Queimador, wax melt e snapbar | Playful Candles',
    seoDescription: 'Tudo para começar nos wax melts: 1 queimador (Grécia ou Amsterdã), 1 wax melt e 1 snapbar à tua escolha.',
    descriptionHtml: '<p>Tudo o que precisas para começar nos wax melts: <strong>1 queimador</strong> (Grécia ou Amsterdã), <strong>1 wax melt</strong> e <strong>1 snapbar</strong> à tua escolha.</p><p>Pousa um pedaço de cera na taça, acende uma vela de chá por baixo e deixa o aroma espalhar-se pela casa.</p>',
  },
  {
    handle: 'pack-snapbar', title: 'Pack Snapbar', sku: 'PK-04', price: '13.50', grams: 180,
    slots: [1, 2, 3].map(() => ({ label: 'Snapbar', type: 'snap' })),
    photos: [['cappuccino-break', 1], ['orange-fruit', 1], ['dama-da-noite', 1], ['maca-do-amor', 0]],
    collections: [],
    seoTitle: 'Pack Snapbar · 3 snapbars à escolha | Playful Candles',
    seoDescription: 'Escolhe 3 snapbars de todos os aromas (podes repetir o teu favorito). Cera vegetal, feitas à mão em Lisboa.',
    descriptionHtml: '<p>Escolhe <strong>3 snapbars</strong> de todos os aromas que temos (podes repetir o teu favorito).</p><p>Cada barra parte-se em quadradinhos: derretes um de cada vez no queimador e a barra dura muito mais.</p>',
  },
];

// ── Estado atual ──
const d = await admin(`{
  products(first:100){ nodes{ id handle options{ id name optionValues{ name } } media(first:10){ nodes{ alt ... on MediaImage{ image{ url } } } }
    variants(first:1){ nodes{ id } } } }
  collections(first:50){ nodes{ id handle } }
  publications(first:10){ nodes{ id name } }
  locations(first:1){ nodes{ id } }
  metafieldDefinitions(first:50, ownerType:PRODUCT, namespace:"custom"){ nodes{ key } }
  codeDiscountNodes(first:50){ nodes{ id codeDiscount{ ... on DiscountCodeBasic{ title status } } } }
}`);
const byHandle = new Map(d.products.nodes.map((p) => [p.handle, p]));
const collectionId = (h) => d.collections.nodes.find((c) => c.handle === h)?.id ?? (() => { throw new Error(`coleção ${h}?`); })();
const photo = ([handle, index]) => {
  const m = byHandle.get(handle)?.media.nodes[index];
  if (!m?.image) throw new Error(`foto ${handle}[${index}] não existe`);
  return { originalSource: m.image.url, alt: m.alt || '', mediaContentType: 'IMAGE' };
};

// ── Metafield custom.pack_slots (lido pela Storefront) ──
if (!d.metafieldDefinitions.nodes.some((m) => m.key === 'pack_slots')) {
  console.log('• definição custom.pack_slots (json, storefront PUBLIC_READ)');
  if (!DRY) {
    const r = await admin(`mutation($d:MetafieldDefinitionInput!){ metafieldDefinitionCreate(definition:$d){ userErrors{ field message } } }`, {
      d: { name: 'Pack — escolhas', namespace: 'custom', key: 'pack_slots', type: 'json', ownerType: 'PRODUCT',
        description: 'Itens que o cliente escolhe no pack: [{label, type: velas|wax|snap|burner, collection?, handles?}]',
        access: { storefront: 'PUBLIC_READ' } },
    });
    check('metafieldDefinitionCreate', r.metafieldDefinitionCreate.userErrors);
  }
}

for (const pack of PACKS) {
  const existing = byHandle.get(pack.handle);
  const media = pack.photos.map(photo);
  console.log(`• ${pack.handle}: ${existing ? 'atualiza' : 'cria'} · ${pack.price} € · ${pack.sku} · ${media.length} foto(s)${pack.bundle ? ` · bundle ${pack.bundle.join('+')}` : ''}`);
  if (DRY) continue;

  // Produto + variante (preço, SKU, peso, inventário). Trio: as fotos já lá estão.
  const input = {
    handle: pack.handle, title: pack.title, productType: 'Pack', vendor: 'Playful Candles', status: 'ACTIVE',
    category: CANDLES, descriptionHtml: pack.descriptionHtml,
    seo: { title: pack.seoTitle, description: pack.seoDescription },
    collections: pack.collections.map(collectionId),
    productOptions: [{ name: 'Title', values: [{ name: 'Default Title' }] }],
    variants: [{
      optionValues: [{ optionName: 'Title', name: 'Default Title' }],
      price: pack.price, sku: pack.sku, inventoryPolicy: 'DENY', taxable: true,
      inventoryItem: { tracked: !!pack.bundle, measurement: { weight: { value: pack.grams, unit: 'GRAMS' } } },
      ...(existing ? { id: existing.variants.nodes[0].id } : {}),
    }],
    metafields: pack.slots ? [{ namespace: 'custom', key: 'pack_slots', type: 'json', value: JSON.stringify(pack.slots) }] : [],
    ...(existing ? { id: existing.id } : { files: media.map(({ originalSource, alt }) => ({ originalSource, alt, contentType: 'IMAGE' })) }),
  };
  const s = await admin(`mutation($i:ProductSetInput!){ productSet(synchronous:true, input:$i){ product{ id } userErrors{ field message } } }`, { i: input });
  check(`productSet ${pack.handle}`, s.productSet.userErrors);
  const productId = s.productSet.product.id;

  if (pack.bundle) {
    // Componentes sem variantes: mapeia a opção única (Title → Default Title) de cada um.
    const components = pack.bundle.map((h) => ({
      productId: byHandle.get(h).id, quantity: 1,
      optionSelections: byHandle.get(h).options.map((o) => ({ componentOptionId: o.id, name: o.name, values: o.optionValues.map((v) => v.name) })),
    }));
    const b = await admin(`mutation($i:ProductBundleUpdateInput!){ productBundleUpdate(input:$i){ productBundleOperation{ id } userErrors{ field message } } }`,
      { i: { productId, components } });
    check(`productBundleUpdate ${pack.handle}`, b.productBundleUpdate.userErrors);
    // A operação é assíncrona: espera até terminar.
    for (let i = 0; i < 20; i++) {
      const o = await admin(`query($id:ID!){ productOperation(id:$id){ status ... on ProductBundleOperation{ userErrors{ message } } } }`, { id: b.productBundleUpdate.productBundleOperation.id });
      check('bundle op', o.productOperation.userErrors);
      if (o.productOperation.status === 'COMPLETE') break;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const p = await admin(`mutation($id:ID!,$i:[PublicationInput!]!){ publishablePublish(id:$id, input:$i){ userErrors{ field message } } }`,
    { id: productId, i: d.publications.nodes.map((pub) => ({ publicationId: pub.id })) });
  check(`publish ${pack.handle}`, p.publishablePublish.userErrors);
}

// ── Descontos "Pack…" por código: desativados ──
for (const n of d.codeDiscountNodes.nodes) {
  if (!/^pack\b/i.test(n.codeDiscount.title ?? '') || n.codeDiscount.status !== 'ACTIVE') continue;
  console.log(`• desativa desconto "${n.codeDiscount.title}"`);
  if (DRY) continue;
  const r = await admin(`mutation($id:ID!){ discountCodeDeactivate(id:$id){ userErrors{ field message } } }`, { id: n.id });
  check('discountCodeDeactivate', r.discountCodeDeactivate.userErrors);
}
console.log(DRY ? '(dry run)' : 'feito');
