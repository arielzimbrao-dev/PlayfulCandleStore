import { getProducts } from '@/lib/shopify';
import { getActivePromos, type Promo } from '@/lib/shopify/admin';
import { productCategory } from '@/lib/filters';
import type { Product, ProductVariant } from '@/lib/shopify/types';

export type BundleItem = { product: Product; variant: ProductVariant; price: number };
export type Bundle = { items: BundleItem[]; original: number; total: number; promo: string | null };

// Variante que vai para o carrinho: a primeira disponível.
const buyable = (p: Product): BundleItem | null => {
  const v = p.variants.find((x) => x.availableForSale);
  return v ? { product: p, variant: v, price: Number(v.price.amount) } : null;
};

const inPromo = (p: Product, handles: string[], cols: string[]) =>
  handles.includes(p.handle) || p.collections.some((c) => cols.includes(c.handle));

// Preferido se disponível; senão um aleatório disponível do mesmo tipo.
function pick(catalog: Product[], preferred: string, cat: string): Product | null {
  const ok = catalog.filter((p) => productCategory(p) === cat && buyable(p));
  return ok.find((p) => p.handle === preferred) ?? ok[Math.floor(Math.random() * ok.length)] ?? null;
}

// Desconto que a promoção dá a este conjunto. Só promoções automáticas: com código o cliente
// teria de o introduzir, e mostrar o preço já descontado enganava.
// ponytail: aproximação das regras da Shopify (ignora mínimos de compra e combinações);
// o checkout é que manda no valor final.
function discountFor(promo: Promo, items: BundleItem[]): number {
  if (!promo.automatic || !promo.effect) return 0;
  const e = promo.effect;
  const targets = promo.gets
    ? items
        .filter((i) => inPromo(i.product, promo.gets!.handles, promo.gets!.collections))
        .sort((a, b) => a.price - b.price)
        .slice(0, promo.gets.qty)
    : items;
  const base = targets.reduce((s, i) => s + i.price, 0);
  const off = e.kind === 'percent' ? base * e.pct : e.each ? e.amount * targets.length : e.amount;
  return Math.min(off, base);
}

// "Leva junto" da PDP:
//  1) se o produto está numa promoção (desconto em produtos / Compre X leve Y) → os outros produtos dessa promoção;
//  2) queimador → Cinnamon Rolls (ou wax melt disponível; senão snapbar Lemon & Raspberry ou outra disponível);
//  3) wax melt / snapbar → Queimador Dubai (ou outro queimador disponível).
// Sem par disponível (ou produto atual indisponível) → null, e a secção não aparece.
export async function getBundle(product: Product): Promise<Bundle | null> {
  const main = buyable(product);
  if (!main) return null;
  const [catalog, promos] = await Promise.all([
    getProducts(100).then((r) => r.products).catch(() => [] as Product[]),
    getActivePromos(),
  ]);
  const others = catalog.filter((p) => p.id !== product.id);

  const promo = promos.find((pr) => inPromo(product, pr.handles, pr.collections));
  let partners: Product[];
  if (promo) {
    // ponytail: no máximo 3 parceiros — promoções de coleção inteira dariam uma fila enorme.
    partners = others.filter((p) => inPromo(p, promo.handles, promo.collections) && buyable(p)).slice(0, 3);
  } else {
    const cat = productCategory(product);
    const partner =
      cat === 'burner'
        ? pick(others, 'cinnamon-rolls', 'wax') ?? pick(others, 'lemon-and-raspberry-snapbar', 'snap')
        : cat === 'wax' || cat === 'snap'
          ? pick(others, 'queimador-dubai', 'burner')
          : null;
    partners = partner ? [partner] : [];
  }
  if (!partners.length) return null;

  const items = [main, ...partners.map((p) => buyable(p)!)];
  const original = items.reduce((s, i) => s + i.price, 0);
  const off = promo ? discountFor(promo, items) : 0;
  return { items, original, total: original - off, promo: off > 0 ? promo!.title : null };
}
