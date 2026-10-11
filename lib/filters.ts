// Filtros facetados (tipo · aroma · preço) — aplicados em memória sobre o lote já buscado.
// Tudo via parâmetros de URL, sem JS no cliente. O catálogo é pequeno; se crescer muito, mover para
// filtros no servidor (ProductFilter das coleções / Search API).
import type { Product } from './shopify/types';

export type CategoryKey = 'velas' | 'wax' | 'snap' | 'burner' | 'pack';

export const TYPE_LABELS: Record<CategoryKey, string> = {
  velas: 'Velas de Copo',
  wax: 'Wax Melts',
  snap: 'Snapbars',
  burner: 'Queimadores',
  pack: 'Packs',
};
export const TYPE_ORDER: CategoryKey[] = ['velas', 'wax', 'snap', 'burner', 'pack'];

// productType (texto livre do Shopify) → categoria da marca. Alinhado com ProductCard.typeLabel.
// A ordem importa: "Pack de velas" tem de cair em pack, não em velas.
export function productCategory(product: Product): CategoryKey | null {
  const type = (product.productType || '').toLowerCase();
  if (type.includes('pack')) return 'pack';
  if (type.includes('snap')) return 'snap';
  if (type.includes('wax') || type.includes('melt')) return 'wax';
  if (type.includes('queim') || type.includes('burner')) return 'burner';
  if (type.includes('vela') || type.includes('candle') || type.includes('copo')) return 'velas';
  return null;
}

export const PRICE_BUCKETS = [
  { key: '0-10', label: 'Até €10', min: 0, max: 10 },
  { key: '10-20', label: '€10–20', min: 10, max: 20 },
  { key: '20-30', label: '€20–30', min: 20, max: 30 },
  { key: '30-40', label: '€30–40', min: 30, max: 40 },
] as const;
export type PriceBucketKey = (typeof PRICE_BUCKETS)[number]['key'];

export type FilterState = { type?: string; scent?: string; price?: string };

export function applyFilters(products: Product[], filters: FilterState): Product[] {
  const bucket = PRICE_BUCKETS.find((b) => b.key === filters.price);
  // Aroma é multisseleção (OR/união): o produto passa se tiver PELO MENOS UM dos aromas escolhidos.
  const selectedScents = (filters.scent ?? '')
    .split(',')
    .map((scent) => scent.trim().toLowerCase())
    .filter(Boolean);
  return products.filter((product) => {
    if (filters.type && productCategory(product) !== filters.type) return false;
    if (
      selectedScents.length &&
      !product.scents.some((scent) => selectedScents.includes(scent.toLowerCase()))
    ) {
      return false;
    }
    if (bucket) {
      const price = Number(product.priceRange.minVariantPrice.amount);
      if (price < bucket.min || price >= bucket.max) return false;
    }
    return true;
  });
}

// Só oferecer chips que existem no conjunto atual (evita filtros que não retornam nada).
export function availableTypes(products: Product[]): CategoryKey[] {
  const presentTypes = new Set(products.map(productCategory).filter(Boolean) as CategoryKey[]);
  return TYPE_ORDER.filter((type) => presentTypes.has(type));
}
export function availableScents(products: Product[]): string[] {
  const scents = new Set<string>();
  for (const product of products) for (const scent of product.scents) scents.add(scent);
  return [...scents].sort((a, b) => a.localeCompare(b, 'pt'));
}

// Produtos relacionados (cross-sell) determinísticos — não dependem de tráfego/algoritmo.
// Regra: wax melt/snapbar → queimador primeiro; queimador → wax + snapbars; depois o mesmo tipo;
// depois o resto.
export function fallbackRelatedProducts(product: Product, catalog: Product[], limit = 4): Product[] {
  const candidates = catalog.filter((candidate) => candidate.id !== product.id);
  const category = productCategory(product);
  const ofCategory = (type: CategoryKey) =>
    candidates.filter((candidate) => productCategory(candidate) === type);
  const seen = new Set<string>();
  const related: Product[] = [];
  const add = (products: Product[]) => {
    for (const candidate of products) {
      if (related.length >= limit) break;
      if (!seen.has(candidate.id)) {
        seen.add(candidate.id);
        related.push(candidate);
      }
    }
  };
  if (category === 'wax' || category === 'snap') add(ofCategory('burner'));
  else if (category === 'burner') {
    add(ofCategory('wax'));
    add(ofCategory('snap'));
  }
  if (category) add(ofCategory(category)); // mais do mesmo tipo (variedade de aromas)
  add(candidates); // completa com o resto
  return related;
}
