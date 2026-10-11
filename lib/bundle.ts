import { getProducts } from '@/lib/shopify';
import { getActivePromos, type Promo } from '@/lib/shopify/admin';
import { productCategory } from '@/lib/filters';
import type { Product, ProductVariant } from '@/lib/shopify/types';

export type BundleItem = { product: Product; variant: ProductVariant; price: number };
export type Bundle = { items: BundleItem[]; original: number; total: number; promo: string | null };

// Variante que vai para o carrinho: a primeira disponível.
const buyableItem = (product: Product): BundleItem | null => {
  const variant = product.variants.find((candidate) => candidate.availableForSale);
  return variant ? { product, variant, price: Number(variant.price.amount) } : null;
};

const isInPromo = (product: Product, promoHandles: string[], promoCollections: string[]) =>
  promoHandles.includes(product.handle) ||
  product.collections.some((collection) => promoCollections.includes(collection.handle));

// Preferido se disponível; senão um aleatório disponível do mesmo tipo.
function pickPartner(
  catalog: Product[],
  preferredHandle: string,
  category: string,
): Product | null {
  const candidates = catalog.filter(
    (product) => productCategory(product) === category && buyableItem(product),
  );
  return (
    candidates.find((product) => product.handle === preferredHandle) ??
    candidates[Math.floor(Math.random() * candidates.length)] ??
    null
  );
}

// Desconto que a promoção dá a este conjunto. Só promoções automáticas: com código o cliente
// teria de digitá-lo, e mostrar o preço já com desconto seria enganoso.
// ponytail: aproximação das regras da Shopify (ignora mínimos de compra e combinações);
// quem manda no valor final é o checkout.
function discountFor(promo: Promo, items: BundleItem[]): number {
  if (!promo.automatic || !promo.effect) return 0;
  const effect = promo.effect;
  // Compre X leve Y: o desconto só vale para os itens "leve", e a Shopify aplica nos mais baratos.
  const discountedItems = promo.gets
    ? items
        .filter((item) => isInPromo(item.product, promo.gets!.handles, promo.gets!.collections))
        .sort((a, b) => a.price - b.price)
        .slice(0, promo.gets.qty)
    : items;
  const discountBase = discountedItems.reduce((sum, item) => sum + item.price, 0);
  const discount =
    effect.kind === 'percent'
      ? discountBase * effect.pct
      : effect.each
        ? effect.amount * discountedItems.length
        : effect.amount;
  return Math.min(discount, discountBase);
}

// "Leva junto" da PDP:
//  1) se o produto está numa promoção (desconto em produtos / Compre X leve Y) → os outros
//     produtos dessa promoção;
//  2) queimador → Cinnamon Rolls (ou wax melt disponível; senão snapbar Lemon & Raspberry ou
//     outra disponível);
//  3) wax melt / snapbar → Queimador Dubai (ou outro queimador disponível).
// Sem par disponível (ou produto atual indisponível) → null, e a seção não aparece.
export async function getBundle(product: Product): Promise<Bundle | null> {
  const mainItem = buyableItem(product);
  if (!mainItem) return null;
  const [catalog, promos] = await Promise.all([
    getProducts(100)
      .then((page) => page.products)
      .catch(() => [] as Product[]),
    getActivePromos(),
  ]);
  const otherProducts = catalog.filter((candidate) => candidate.id !== product.id);

  const promo = promos.find((candidate) =>
    isInPromo(product, candidate.handles, candidate.collections),
  );
  let partners: Product[];
  if (promo) {
    // ponytail: no máximo 3 parceiros — promoções de coleção inteira dariam uma fila enorme.
    partners = otherProducts
      .filter(
        (candidate) =>
          isInPromo(candidate, promo.handles, promo.collections) && buyableItem(candidate),
      )
      .slice(0, 3);
  } else {
    const category = productCategory(product);
    const partner =
      category === 'burner'
        ? (pickPartner(otherProducts, 'cinnamon-rolls', 'wax') ??
          pickPartner(otherProducts, 'lemon-and-raspberry-snapbar', 'snap'))
        : category === 'wax' || category === 'snap'
          ? pickPartner(otherProducts, 'queimador-dubai', 'burner')
          : null;
    partners = partner ? [partner] : [];
  }
  if (!partners.length) return null;

  const items = [mainItem, ...partners.map((partner) => buyableItem(partner)!)];
  const original = items.reduce((sum, item) => sum + item.price, 0);
  const discount = promo ? discountFor(promo, items) : 0;
  return {
    items,
    original,
    total: original - discount,
    promo: discount > 0 ? promo!.title : null,
  };
}
