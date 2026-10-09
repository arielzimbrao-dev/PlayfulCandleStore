import type { NextConfig } from 'next';

const config: NextConfig = {
  // Build autocontido para a imagem Docker (Coolify): .next/standalone traz só o necessário.
  output: 'standalone',
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.shopify.com' }],
    // 75 é o default do Next e chega para thumbnails; 90 é para as imagens grandes de marca
    // (hero, banners, fotos de produto), onde a compressão a 75 se nota nos gradientes rosa.
    qualities: [75, 90],
    // ponytail: sem AVIF — o Next converte q90 em AVIF q56, que apaga a textura das fotos (kraft, papel).
    // WebP q90 pesa ~2,5x mais mas mantém o detalhe das fotos profissionais.
    formats: ['image/webp'],
  },
  // Produtos renomeados (Out 2026) — manter os URLs antigos a funcionar.
  async redirects() {
    return [
      { source: '/produtos/queimador-branco', destination: '/produtos/queimador-grecia', permanent: true },
      { source: '/produtos/queimador-chiquissimo', destination: '/produtos/queimador-dubai', permanent: true },
      { source: '/produtos/queimador-rosa', destination: '/produtos/queimador-amsterda', permanent: true },
    ];
  },
};

export default config;
