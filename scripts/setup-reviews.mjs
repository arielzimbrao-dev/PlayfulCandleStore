// Avaliações como metaobjects "avaliacao" (Admin → Conteúdo → Metaobjects → Avaliações).
// Rascunho = pendente; Ativo = publicada no site. Este script (idempotente):
//   1. cria a definição do metaobject, se ainda não existir;
//   2. migra as avaliações antigas do metafield JSON custom.reviews para metaobjects
//      (approved:false → Rascunho) e apaga o metafield migrado.
// Uso: node scripts/setup-reviews.mjs
import { readFileSync } from 'node:fs';

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

// 1. Definição
const { metaobjectDefinitionByType } = await admin(`{ metaobjectDefinitionByType(type:"avaliacao"){ id } }`);
if (metaobjectDefinitionByType) {
  console.log('definição já existe:', metaobjectDefinitionByType.id);
} else {
  const d = await admin(`mutation($def:MetaobjectDefinitionCreateInput!){
    metaobjectDefinitionCreate(definition:$def){ metaobjectDefinition{ id } userErrors{ field message } } }`, {
    def: {
      type: 'avaliacao',
      name: 'Avaliações',
      description: 'Avaliações enviadas na página de produto. Rascunho = pendente; muda para Ativo para publicar no site.',
      displayNameKey: 'nome',
      access: { storefront: 'PUBLIC_READ' },
      capabilities: { publishable: { enabled: true } },
      fieldDefinitions: [
        { key: 'produto', name: 'Produto', type: 'product_reference', required: true },
        { key: 'nome', name: 'Nome', type: 'single_line_text_field', required: true },
        { key: 'classificacao', name: 'Classificação', type: 'rating', required: true,
          validations: [{ name: 'scale_min', value: '1' }, { name: 'scale_max', value: '5' }] },
        { key: 'comentario', name: 'Comentário', type: 'multi_line_text_field', required: true },
        { key: 'data', name: 'Data', type: 'date_time' },
        { key: 'compra_verificada', name: 'Compra verificada', type: 'boolean' },
        { key: 'foto', name: 'Foto do cliente', type: 'url' },
      ],
    },
  });
  check('metaobjectDefinitionCreate', d.metaobjectDefinitionCreate.userErrors);
  console.log('definição criada:', d.metaobjectDefinitionCreate.metaobjectDefinition.id);
}

// 2. Migração do JSON antigo
const { products } = await admin(`{ products(first:250){ nodes{ id handle metafield(namespace:"custom",key:"reviews"){ id value } } } }`);
for (const product of products.nodes.filter((p) => p.metafield)) {
  let list = [];
  try { const v = JSON.parse(product.metafield.value); list = Array.isArray(v) ? v : (v.items || []); } catch { console.warn(`${product.handle}: JSON inválido, ignorado`); continue; }
  for (const r of list) {
    const c = await admin(`mutation($m:MetaobjectCreateInput!){ metaobjectCreate(metaobject:$m){ metaobject{ id } userErrors{ field message } } }`, {
      m: {
        type: 'avaliacao',
        capabilities: { publishable: { status: r.approved === false ? 'DRAFT' : 'ACTIVE' } },
        fields: [
          { key: 'produto', value: product.id },
          { key: 'nome', value: String(r.author || 'Cliente') },
          { key: 'classificacao', value: JSON.stringify({ value: String(Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)))), scale_min: '1', scale_max: '5' }) },
          { key: 'comentario', value: String(r.text || '-') },
          ...(r.date ? [{ key: 'data', value: r.date }] : []),
          { key: 'compra_verificada', value: String(!!r.verified) },
          ...(r.photo ? [{ key: 'foto', value: r.photo }] : []),
        ],
      },
    });
    check(`metaobjectCreate ${product.handle}`, c.metaobjectCreate.userErrors);
  }
  // Só apaga depois de todas migradas (um erro acima interrompe antes de chegar aqui).
  const del = await admin(`mutation($m:[MetafieldIdentifierInput!]!){ metafieldsDelete(metafields:$m){ userErrors{ message } } }`,
    { m: [{ ownerId: product.id, namespace: 'custom', key: 'reviews' }] });
  check('metafieldsDelete', del.metafieldsDelete.userErrors);
  console.log(`${product.handle}: ${list.length} migrada(s)`);
}
