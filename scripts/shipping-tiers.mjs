// Gera os escalões de portes por peso a partir do 1.º escalão de cada zona do perfil geral.
// Ex.: zona com "0–1 kg a €5" → cria 1–2 kg €10, 2–3 kg €15, … até MAX_KG.
// O prazo de entrega é o "Tempo de trânsito" do 1.º escalão; o script copia-o e o site lê-o daí.
// Para mudar o preço ou o prazo: altera só o 1.º escalão na Shopify e corre o script de novo (os escalões
// gerados antes — mesmo nome, peso mínimo > 0 — são apagados e recriados).
// Uso: node scripts/shipping-tiers.mjs --dry  |  node scripts/shipping-tiers.mjs
import { readFileSync } from 'node:fs';

const MAX_KG = 10;

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

const kg = ({ value, unit }) => (unit === 'GRAMS' ? value / 1000 : value);
const { deliveryProfiles } = await admin(`{ deliveryProfiles(first:10){ nodes{ id default
  profileLocationGroups{ locationGroup{ id } locationGroupZones(first:20){ nodes{ zone{ id name }
    methodDefinitions(first:100){ nodes{ id name description active rateProvider{ ... on DeliveryRateDefinition{ price{ amount currencyCode } } }
      methodConditions{ field operator conditionCriteria{ ... on Weight{ value unit } } } } } } } } } } }`);
const profile = deliveryProfiles.nodes.find((p) => p.default);

const toDelete = [];
const groupsToUpdate = [];
for (const group of profile.profileLocationGroups) {
  const zonesToUpdate = [];
  for (const { zone, methodDefinitions } of group.locationGroupZones.nodes) {
    const methods = methodDefinitions.nodes.map((m) => {
      const w = (op) => m.methodConditions.find((c) => c.field === 'TOTAL_WEIGHT' && c.operator.startsWith(op));
      return { ...m, min: w('GREATER') ? kg(w('GREATER').conditionCriteria) : 0, max: w('LESS') ? kg(w('LESS').conditionCriteria) : null };
    });
    const base = methods.find((m) => m.min === 0 && m.max && m.rateProvider?.price);
    if (!base) { console.log(`⚠ ${zone.name}: sem escalão "0–X kg" — ignorada`); continue; }
    const old = methods.filter((m) => m.name === base.name && m.min > 0);
    toDelete.push(...old.map((m) => m.id));
    const price = Number(base.rateProvider.price.amount), currencyCode = base.rateProvider.price.currencyCode;
    const created = [];
    for (let n = 2; n * base.max <= MAX_KG + 1e-9; n++) {
      const min = +((n - 1) * base.max + 0.001).toFixed(3), max = +(n * base.max).toFixed(3);
      created.push({
        name: base.name, description: base.description, active: true,
        rateDefinition: { price: { amount: (price * n).toFixed(2), currencyCode } },
        weightConditionsToCreate: [
          { operator: 'GREATER_THAN_OR_EQUAL_TO', criteria: { value: min, unit: 'KILOGRAMS' } },
          { operator: 'LESS_THAN_OR_EQUAL_TO', criteria: { value: max, unit: 'KILOGRAMS' } },
        ],
      });
    }
    console.log(`• ${zone.name} ("${base.name}"): base ${base.max} kg = ${price} ${currencyCode}; apaga ${old.length}, cria ${created.length}`);
    created.forEach((c) => console.log(`    ${c.weightConditionsToCreate[0].criteria.value}–${c.weightConditionsToCreate[1].criteria.value} kg → ${c.rateDefinition.price.amount}`));
    zonesToUpdate.push({ id: zone.id, methodDefinitionsToCreate: created });
  }
  if (zonesToUpdate.length) groupsToUpdate.push({ id: group.locationGroup.id, zonesToUpdate });
}
if (DRY) process.exit(0);

const d = await admin(`mutation($id:ID!,$p:DeliveryProfileInput!){ deliveryProfileUpdate(id:$id, profile:$p){ userErrors{ field message } } }`,
  { id: profile.id, p: { methodDefinitionsToDelete: toDelete, locationGroupsToUpdate: groupsToUpdate } });
if (d.deliveryProfileUpdate.userErrors.length) throw new Error(JSON.stringify(d.deliveryProfileUpdate.userErrors));
console.log('✓ Escalões atualizados na Shopify.');

// ── Tempo de trânsito: copia o do 1.º escalão para os gerados ────────────────────────────────────
// ponytail: o campo só existe na API "unstable" (rateGroups); se a Shopify o mudar, este passo
// falha mas os escalões acima já ficaram criados — basta preencher o trânsito à mão.
const unstable = async (query, variables = {}) => {
  const j = await (await fetch(`https://${dom}/admin/api/unstable/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': tk.access_token },
    body: JSON.stringify({ query, variables }),
  })).json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
};
const fresh = await unstable(`{ deliveryProfiles(first:3){ nodes{ id default profileLocationGroups{ locationGroup{ id }
  locationGroupZones(first:5){ nodes{ zone{ id name } methodDefinitions(first:25){ nodes{ id name
    methodConditions{ operator conditionCriteria{ ... on Weight{ value } } }
    rateGroups(first:1){ nodes{ id rateProviders(first:1){ nodes{ ... on DeliveryRateDefinition{ id minTransitTime maxTransitTime } } } } } } } } } } } } }`);
const freshProfile = fresh.deliveryProfiles.nodes.find((p) => p.default);
const transitGroups = freshProfile.profileLocationGroups.map((group) => ({
  id: group.locationGroup.id,
  zonesToUpdate: group.locationGroupZones.nodes.map(({ zone, methodDefinitions }) => {
    const isBase = (m) => m.methodConditions.some((c) => c.operator.startsWith('GREATER') && c.conditionCriteria.value === 0);
    const base = methodDefinitions.nodes.find(isBase);
    const rate = base?.rateGroups.nodes[0]?.rateProviders.nodes[0];
    if (!rate?.minTransitTime) { console.log(`⚠ ${zone.name}: 1.º escalão sem tempo de trânsito`); return { id: zone.id }; }
    console.log(`• ${zone.name}: trânsito ${rate.minTransitTime / 86400}–${rate.maxTransitTime / 86400} dias em todos os escalões`);
    return {
      id: zone.id,
      methodDefinitionsToUpdate: methodDefinitions.nodes
        .filter((m) => m.name === base.name && !isBase(m))
        .map((m) => ({ id: m.id, rateGroupsToUpdate: m.rateGroups.nodes.map((g) => ({ id: g.id,
          rateDefinitionsToUpdate: g.rateProviders.nodes.map((r) => ({ id: r.id, minTransitTime: rate.minTransitTime, maxTransitTime: rate.maxTransitTime })) })) })),
    };
  }),
}));
const t = await unstable(`mutation($id:ID!,$p:DeliveryProfileInput!){ deliveryProfileUpdate(id:$id, profile:$p){ userErrors{ field message } } }`,
  { id: freshProfile.id, p: { locationGroupsToUpdate: transitGroups } });
if (t.deliveryProfileUpdate.userErrors.length) throw new Error(JSON.stringify(t.deliveryProfileUpdate.userErrors));
console.log('✓ Tempo de trânsito copiado.');
