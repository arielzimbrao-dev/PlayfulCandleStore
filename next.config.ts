import type { NextConfig } from 'next';
import { CATEGORY_HANDLES } from './lib/categories';

const config: NextConfig = {
  // Build autocontido para a imagem Docker (Coolify): .next/standalone traz só o necessário.
  output: 'standalone',
  // Com o chunking por omissão (true) a home saía com 13–15 <link> de CSS bloqueantes; com false
  // sai com 2 (LCP mobile local 4,2–5,4 s → 3,5 s). O CSS a mais por rota é pouco (~70 KB).
  experimental: { cssChunking: false },
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.shopify.com' }],
    // 75 é o default do Next e chega para thumbnails; 90 é para as imagens grandes de marca
    // (hero, banners, fotos de produto), onde a compressão a 75 se nota nos gradientes rosa.
    qualities: [75, 90],
    // ponytail: sem AVIF — o Next converte q90 em AVIF q56, que apaga a textura das fotos
    // (kraft, papel). WebP q90 pesa ~2,5x mais, mas mantém o detalhe das fotos profissionais.
    formats: ['image/webp'],
  },
  async headers() {
    // ponytail: sem CSP — GTM, GA e o checkout da Shopify precisariam de uma lista longa de origens.
    const security = [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ];
    // Ficheiros de /public: 30 dias. Ao trocar uma foto de banner, muda-se o nome do ficheiro.
    const longCache = [{ key: 'Cache-Control', value: 'public, max-age=2592000' }];
    return [
      { source: '/:path*', headers: security },
      ...['images', 'icons', 'fonts'].map((dir) => ({ source: `/${dir}/:path*`, headers: longCache })),
    ];
  },
  // Produtos renomeados (out/2026) — manter as URLs antigas funcionando.
  async redirects() {
    const renamedProducts: [oldHandle: string, newHandle: string][] = [
      ['queimador-branco', 'queimador-grecia'],
      ['queimador-chiquissimo', 'queimador-dubai'],
      ['queimador-rosa', 'queimador-amsterda'],
    ];
    return [
      ...renamedProducts.map(([oldHandle, newHandle]) => ({
        source: `/produtos/${oldHandle}`,
        destination: `/produtos/${newHandle}`,
        permanent: true,
      })),
      // As categorias já viveram em /colecoes/ — 301 aqui (o redirect() da página sai como
      // meta-refresh com 200 quando a resposta já está em streaming).
      ...CATEGORY_HANDLES.map((handle) => ({
        source: `/colecoes/${handle}`,
        destination: `/categorias/${handle}`,
        permanent: true,
      })),
    ];
  },
};

export default config;
