// Single source of truth for SEO / structured data / NAP (Name-Address-Phone).
// ⚠️ Preencher os campos marcados TODO com os dados reais (ver manual_required.md).

export const SITE = {
  name: 'Playful Candles',
  legalName: 'Paloma da Cruz Marques', // empresária em nome individual (atividade aberta nas Finanças)
  nif: '314148213',
  // Domínio oficial: playfulcandles.com. NEXT_PUBLIC_SITE_URL tem prioridade; `||` (não `??`) porque o
  // Docker passa build args não definidas como string vazia.
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://playfulcandles.com').replace(/\/$/, ''),
  // Contas de cliente (Shopify hosted). Trocar por NEXT_PUBLIC_ACCOUNT_URL se mudar.
  accountUrl: process.env.NEXT_PUBLIC_ACCOUNT_URL || 'https://shopify.com/98533048648/account',
  locale: 'pt_PT',
  description:
    'Velas de copo, wax melts, snapbars e queimadores feitos à mão em Lisboa, com ceras vegetais e fragrâncias premium. Portes grátis acima de €35 e entrega em 24/72h em Portugal continental.',
  currency: 'EUR',
  freeShippingThreshold: 35, // € — portes grátis acima deste valor (alinhar com a regra na Shopify)
  logo: '/images/logo.png',
  telephone: '+351937820986', // também WhatsApp
  whatsapp: 'https://wa.me/351937820986',
  // Grupo "Playful VIP" — acesso antecipado a coleções + ofertas exclusivas (substitui a newsletter por email).
  vipGroup: 'https://chat.whatsapp.com/IeUzRHoQVX4Kiac8nkX6Vr',
  // Endereço de função (criar a caixa/reencaminhamento em playfulcandles.com antes do lançamento).
  email: 'geral@playfulcandles.com',
  address: {
    streetAddress: 'Rua Pio XII, 12, 1.º Esq.',
    addressLocality: 'Amadora',
    addressRegion: 'Lisboa',
    postalCode: '2700-657',
    addressCountry: 'PT',
  },
  social: {
    instagram: 'https://www.instagram.com/theplayfulcandles/',
    tiktok: 'https://www.tiktok.com/@theplayfulcandles',
    pinterest: 'https://www.pinterest.com/theplayfulcandles',
    google: 'https://share.google/DphzSoO0MEHFYOGAI',
  },
} as const;

export const sameAs = Object.values(SITE.social);

export function abs(path: string): string {
  if (!path) return SITE.url;
  if (path.startsWith('http')) return path;
  return `${SITE.url}${path.startsWith('/') ? '' : '/'}${path}`;
}
