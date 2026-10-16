import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /pesquisa fica rastreável de propósito: é noindex, e o Google só vê o noindex se puder lê-la.
      disallow: ['/api/', '/carrinho'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
