import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.shopify.com' }],
    // 75 é o default do Next e chega para thumbnails; 90 é para as imagens grandes de marca
    // (hero, banners, fotos de produto), onde a compressão a 75 se nota nos gradientes rosa.
    qualities: [75, 90],
    formats: ['image/avif', 'image/webp'],
  },
};

export default config;
