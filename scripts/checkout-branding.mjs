// Aplica o branding do checkout (cores, cantos, tipografia) via Admin API (checkoutBrandingUpsert).
// ⚠ REQUER Shopify PLUS (ou loja de desenvolvimento). Em planos normais devolve ACCESS_DENIED —
//   aí o branding faz-se à mão em: Admin → Definições → Checkout → Personalizar.
// Uso (só em Plus): node scripts/checkout-branding.mjs
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const dom = env.SHOPIFY_STORE_DOMAIN;

const r = await fetch(`https://${dom}/admin/oauth/access_token`, {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET }),
});
const tok = (await r.json()).access_token;
const admin = (q, v = {}) => fetch(`https://${dom}/admin/api/2026-07/graphql.json`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': tok },
  body: JSON.stringify({ query: q, variables: v }),
}).then((x) => x.json());

const { data: pd } = await admin(`query{ checkoutProfiles(first:1){ nodes{ id } } }`);
const profileId = pd.checkoutProfiles.nodes[0].id;
console.log('Perfil:', profileId);

const MUT = `mutation($id:ID!,$input:CheckoutBrandingInput!){
  checkoutBrandingUpsert(checkoutProfileId:$id, checkoutBrandingInput:$input){
    checkoutBranding{ designSystem{ colors{ global{ accent brand } } cornerRadius{ base } } }
    userErrors{ field message }
  }
}`;

const step = async (label, input) => {
  const j = await admin(MUT, { id: profileId, input });
  const errs = j.errors ?? j.data?.checkoutBrandingUpsert?.userErrors ?? [];
  console.log(`\n[${label}] ${errs.length ? '⚠ ERROS' : '✓ OK'}`);
  if (errs.length) console.log(JSON.stringify(errs, null, 2));
  else console.log(JSON.stringify(j.data.checkoutBrandingUpsert.checkoutBranding));
  return errs.length === 0;
};

// Passo 1 — cores + esquemas (sem cantos — Plus-gated neste plano)
await step('cores+esquemas', {
  designSystem: {
    colors: {
      global: { accent: '#CC1A52', brand: '#FF5CA6' },
      schemes: {
        scheme1: {
          base: { background: '#FBFBFB', text: '#2A1524' },
          primaryButton: { background: '#CC1A52', text: '#FFFFFF', hover: { background: '#A81244', text: '#FFFFFF' } },
        },
        scheme2: { base: { background: '#FFF4FE', text: '#2A1524' } },
      },
    },
  },
  customizations: {
    main: { colorScheme: 'COLOR_SCHEME1' },
    orderSummary: { colorScheme: 'COLOR_SCHEME2' },
    primaryButton: { background: 'SOLID' },
  },
});

// Passo 1b — raio dos cantos (variáveis do design system em px; pode ser ignorado sem Plus)
await step('cantos (px)', { designSystem: { cornerRadius: { base: 12, small: 8, large: 20 } } });

// Passo 2 — tipografia Poppins (pode exigir Plus)
await step('tipografia Poppins', {
  designSystem: {
    typography: {
      primary: { shopifyFontGroup: { name: 'Poppins', baseWeight: 400, boldWeight: 700 } },
      secondary: { shopifyFontGroup: { name: 'Poppins', baseWeight: 400, boldWeight: 700 } },
    },
  },
});
