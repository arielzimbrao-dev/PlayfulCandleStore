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
    'Velas de copo, wax melts, snapbars e queimadores feitos à mão em Lisboa, com cera vegetal. Expedimos em 24h para Portugal continental e Espanha peninsular.',
  currency: 'EUR',
  logo: '/images/logo.png',
  telephone: '+351937820986', // também WhatsApp
  whatsapp: 'https://wa.me/351937820986',
  // Botão "Avisa-me" (produto esgotado) vai para outro número.
  notifyWhatsapp: 'https://wa.me/351937821016',
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
    google: 'https://share.google/DphzSoO0MEHFYOGAI', // ficha Google "The Playful Candles"
  },
  // Nota e nº de avaliações da ficha Google (selo GoogleRating). Atualizar à mão com os valores
  // reais da ficha — nunca arredondar para cima nem inventar.
  googleReviews: { rating: 5 as number, count: 2 as number }, // `as number`: o `as const` fixaria os literais
} as const;

export const SOCIAL_PROFILE_URLS = Object.values(SITE.social);

// Converte caminho relativo em URL absoluta (exigida em JSON-LD, OG e sitemap).
export function absoluteUrl(path: string): string {
  if (!path) return SITE.url;
  if (path.startsWith('http')) return path;
  return `${SITE.url}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Esgotado: "Avisa-me" abre o WhatsApp com uma mensagem pronta pedindo aviso de reposição.
export const notifyMeHref = (title: string) =>
  `${SITE.notifyWhatsapp}?text=${encodeURIComponent(`Olá! Avisem-me quando "${title}" voltar ao stock 🕯️`)}`;

// Base do Open Graph. O `openGraph` de uma página substitui o do layout por inteiro (não junta),
// por isso as páginas que o definem espalham esta base para não perder site_name/locale/type.
export const OG_BASE = { type: 'website', locale: SITE.locale, siteName: SITE.name } as const;
