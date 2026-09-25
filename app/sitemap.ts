import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { getCollections, getProducts } from '@/lib/shopify';
import { CATEGORIES, CATEGORY_HANDLES, NON_COLLECTION_HANDLES } from '@/lib/categories';
import { productCategory } from '@/lib/filters';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/produtos',
    '/colecoes',
    '/sobre',
    '/contacto',
    '/faq',
    '/envios',
    '/devolucoes',
    '/termos',
    '/privacidade',
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.6,
  }));

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const [{ products }, collections] = await Promise.all([getProducts(250), getCollections(50)]);
    // Só listar categorias com produtos: as vazias renderizam "em breve" com noindex
    // (ver generateMetadata em /categorias/[handle]) e dariam erro no Search Console.
    const filled = new Set(products.map(productCategory).filter(Boolean));
    dynamicRoutes = [
      ...products.map((p) => ({
        url: `${base}/produtos/${p.handle}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      // categorias (tipos) em /categorias/
      ...CATEGORY_HANDLES.filter((h) => filled.has(CATEGORIES[h].type)).map((h) => ({
        url: `${base}/categorias/${h}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      // coleções curadas em /colecoes/ (exclui tipos de produto e a "Home page" da Shopify)
      ...collections
        .filter((c) => !NON_COLLECTION_HANDLES.has(c.handle))
        .map((c) => ({
          url: `${base}/colecoes/${c.handle}`,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })),
    ];
  } catch {
    // Shopify indisponível no build → devolve só as rotas estáticas.
  }

  return [...staticRoutes, ...dynamicRoutes];
}
