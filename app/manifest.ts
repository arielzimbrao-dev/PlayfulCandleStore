import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Playful Candles — Velas artesanais',
    short_name: 'Playful Candles',
    description: 'Velas artesanais feitas à mão em Lisboa. Envio para todo o Portugal.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff7fb',
    theme_color: '#ff5ca6',
    lang: 'pt-PT',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
