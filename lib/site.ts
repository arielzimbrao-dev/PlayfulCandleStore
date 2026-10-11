// Fonte única de verdade para SEO / dados estruturados / NAP (nome, endereço, telefone).

export const SITE = {
  name: 'Playful Candles',
  // Empresária em nome individual (atividade aberta nas Finanças).
  legalName: 'Paloma da Cruz Marques',
  nif: '314148213',
  // Domínio oficial: playfulcandles.com. NEXT_PUBLIC_SITE_URL tem prioridade; `||` (não `??`)
  // porque o Docker passa build args não definidos como string vazia.
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://playfulcandles.com').replace(/\/$/, ''),
  // Contas de cliente (Shopify hosted). Trocar por NEXT_PUBLIC_ACCOUNT_URL se mudar.
  accountUrl: process.env.NEXT_PUBLIC_ACCOUNT_URL || 'https://shopify.com/98533048648/account',
  locale: 'pt_PT',
  description:
    'Velas de copo, wax melts, snapbars e queimadores feitos à mão em Lisboa, com ceras vegetais e fragrâncias premium. Portes grátis acima de €35 e entrega em 24/72h em Portugal continental.',
  currency: 'EUR',
  // € — frete grátis acima deste valor (manter alinhado com a regra configurada na Shopify).
  freeShippingThreshold: 35,
  logo: '/images/logo.png',
  telephone: '+351937820986', // também WhatsApp
  whatsapp: 'https://wa.me/351937820986',
  // Grupo "Playful VIP" — acesso antecipado a coleções + ofertas exclusivas (substitui a
  // newsletter por e-mail).
  vipGroup: 'https://chat.whatsapp.com/IeUzRHoQVX4Kiac8nkX6Vr',
  // Endereço genérico (criar a caixa/redirecionamento em playfulcandles.com antes do lançamento).
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

export const SOCIAL_PROFILE_URLS = Object.values(SITE.social);

// Converte caminho relativo em URL absoluta (exigida em JSON-LD, OG e sitemap).
export function absoluteUrl(path: string): string {
  if (!path) return SITE.url;
  if (path.startsWith('http')) return path;
  return `${SITE.url}${path.startsWith('/') ? '' : '/'}${path}`;
}
