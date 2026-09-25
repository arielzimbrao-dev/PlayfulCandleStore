// Categorias (tipos de produto) — servidas em /categorias/[handle]. Cada uma traz o copy + imagem
// do banner (EU-PT; estas páginas renderizam sempre em PT). Coleções reais ficam em /colecoes/.
import { TYPE_HANDLES } from './shopify/types';
import type { TypeKey } from './filters';

export type Category = { title: string; query: string; text: string; image: string; type: TypeKey };

export const CATEGORIES: Record<string, Category> = {
  'velas-de-copo': {
    title: 'Velas de Copo',
    query: 'product_type:Vela',
    text: 'Horas de aroma num copo giro que podes reutilizar depois. Cera vegetal e fragrâncias que se notam mal acendes.',
    image: '/images/instagram/ig1.jpg',
    type: 'velas',
  },
  'wax-melts': {
    title: 'Wax Melts',
    query: "product_type:'Wax Melt'",
    text: 'Cera para pôr no queimador. Sem chama nem pavio: derrete e a divisão fica a cheirar em minutos.',
    image: '/images/instagram/ig3.jpg',
    type: 'wax',
  },
  snapbars: {
    title: 'Snapbars',
    query: 'product_type:Snapbar',
    text: 'Parte, aquece e muda o mood. Barras de cera perfeitas para experimentar vários aromas ao teu gosto.',
    image: '/images/instagram/ig4.jpg',
    type: 'snap',
  },
  queimadores: {
    title: 'Queimadores',
    query: 'product_type:Queimador',
    text: 'Cerâmica para derreter os teus wax melts e snapbars, bonita o suficiente para ficar à vista.',
    image: '/images/instagram/ig2.jpg',
    type: 'burner',
  },
  packs: {
    title: 'Packs',
    query: 'product_type:Pack',
    text: 'Conjuntos prontos a oferecer, ou a guardar para ti. Vários aromas bem embalados numa só caixa.',
    image: '/images/instagram/ig4.jpg',
    type: 'pack',
  },
};

export const CATEGORY_HANDLES = Object.keys(CATEGORIES);

// Coleções que NÃO são coleções curadas: os tipos de produto (têm páginas em /categorias/)
// e a "Home page" que a Shopify cria por omissão. Usado em /colecoes e no sitemap.
export const NON_COLLECTION_HANDLES = new Set<string>([...TYPE_HANDLES, 'frontpage', 'home-page', 'homepage']);
