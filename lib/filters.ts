// Filtros facetados (tipo · aroma · preço) — aplicados em memória sobre o lote já buscado.
// Tudo via URL params, sem JS de cliente. Catálogo pequeno; se crescer muito, mover para
// filtros server-side (ProductFilter das coleções / Search API).
import type { Product } from './shopify/types';

export type TypeKey = 'velas' | 'wax' | 'snap' | 'burner' | 'pack';

export const TYPE_LABELS: Record<TypeKey, string> = {
  velas: 'Velas de Copo',
  wax: 'Wax Melts',
  snap: 'Snapbars',
  burner: 'Queimadores',
  pack: 'Packs',
};
export const TYPE_ORDER: TypeKey[] = ['velas', 'wax', 'snap', 'burner', 'pack'];

// productType (texto livre do Shopify) → categoria da marca. Alinhado com ProductCard.typeLabel.
export function productCategory(p: Product): TypeKey | null {
  const s = (p.productType || '').toLowerCase();
  if (s.includes('pack')) return 'pack';
  if (s.includes('snap')) return 'snap';
  if (s.includes('wax') || s.includes('melt')) return 'wax';
  if (s.includes('queim') || s.includes('burner')) return 'burner';
  if (s.includes('vela') || s.includes('candle') || s.includes('copo')) return 'velas';
  return null;
}

export const PRICE_BUCKETS = [
  { key: '0-10', label: 'Até €10', min: 0, max: 10 },
  { key: '10-20', label: '€10–20', min: 10, max: 20 },
  { key: '20-30', label: '€20–30', min: 20, max: 30 },
  { key: '30-40', label: '€30–40', min: 30, max: 40 },
] as const;
export type PriceKey = (typeof PRICE_BUCKETS)[number]['key'];

export type FilterState = { type?: string; scent?: string; price?: string };

export function applyFilters(products: Product[], f: FilterState): Product[] {
  const bucket = PRICE_BUCKETS.find((b) => b.key === f.price);
  // Aroma é multi-seleção (OR/união): o produto passa se tiver PELO MENOS UM dos aromas escolhidos.
  const scents = (f.scent ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return products.filter((p) => {
    if (f.type && productCategory(p) !== f.type) return false;
    if (scents.length && !p.scents.some((s) => scents.includes(s.toLowerCase()))) return false;
    if (bucket) {
      const price = Number(p.priceRange.minVariantPrice.amount);
      if (price < bucket.min || price >= bucket.max) return false;
    }
    return true;
  });
}

// Só oferecer chips que existem no conjunto atual (evita filtros mortos).
export function availableTypes(products: Product[]): TypeKey[] {
  const set = new Set(products.map(productCategory).filter(Boolean) as TypeKey[]);
  return TYPE_ORDER.filter((t) => set.has(t));
}
export function availableScents(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) for (const s of p.scents) set.add(s);
  return [...set].sort((a, b) => a.localeCompare(b, 'pt'));
}

// Produtos relacionados (cross-sell) determinístico — não depende de tráfego/algoritmo.
// Regra: wax melt/snapbar → queimador primeiro; queimador → wax + snapbars; depois mesmo tipo; depois o resto.
export function relatedProducts(product: Product, all: Product[], limit = 4): Product[] {
  const pool = all.filter((p) => p.id !== product.id);
  const cat = productCategory(product);
  const byCat = (c: TypeKey) => pool.filter((p) => productCategory(p) === c);
  const seen = new Set<string>();
  const out: Product[] = [];
  const add = (ps: Product[]) => {
    for (const p of ps) {
      if (out.length >= limit) break;
      if (!seen.has(p.id)) { seen.add(p.id); out.push(p); }
    }
  };
  if (cat === 'wax' || cat === 'snap') add(byCat('burner'));
  else if (cat === 'burner') { add(byCat('wax')); add(byCat('snap')); }
  if (cat) add(byCat(cat)); // mais do mesmo tipo (variedade de aromas)
  add(pool); // preenche com o resto
  return out.slice(0, limit);
}
