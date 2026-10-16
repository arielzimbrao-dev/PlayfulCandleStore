import { getProducts } from '@/lib/shopify';
import { getVariantStock } from '@/lib/shopify/admin';
import { productCategory } from '@/lib/filters';
import type { Image, PackSlot, Product } from '@/lib/shopify/types';

// Packs de escolha: o pack é um produto com preço próprio; o cliente escolhe os itens
// (regras em custom.pack_slots) e a escolha vai como propriedades da linha do carrinho
// ("Vela: Cappuccino"), que aparecem no carrinho, no checkout e na encomenda.
// O stock dos itens escolhidos é descontado pelo webhook orders/create
// (app/api/webhooks/orders-create); cancelamentos/devoluções repõem-se à mão.

export type PackOption = {
  handle: string;
  title: string;
  variantId: string;
  image: Image | null;
  /** null = sem limite de stock */
  stock: number | null;
};

// Nome de cada item na linha do carrinho; rótulos repetidos ganham número ("Snapbar 1", "Snapbar 2"…).
export function slotKeys(slots: PackSlot[]): string[] {
  return slots.map((slot, index) => {
    const same = slots.filter((other) => other.label === slot.label);
    return same.length > 1 ? `${slot.label} ${slots.slice(0, index + 1).filter((other) => other.label === slot.label).length}` : slot.label;
  });
}

const fitsSlot = (product: Product, slot: PackSlot) =>
  productCategory(product) === slot.type &&
  (!slot.collection || product.collections.some((collection) => collection.handle === slot.collection)) &&
  (!slot.handles?.length || slot.handles.includes(product.handle));

// Opções de cada item do pack: produtos à venda que cabem na regra, com o stock real.
export async function getPackOptions(slots: PackSlot[]): Promise<PackOption[][]> {
  const catalog = (await getProducts(100)).products.filter((product) =>
    product.variants.some((variant) => variant.availableForSale),
  );
  const variantOf = (product: Product) => product.variants.find((variant) => variant.availableForSale)!;
  const stock = await getVariantStock(catalog.map((product) => variantOf(product).id));
  return slots.map((slot) =>
    catalog
      .filter((product) => fitsSlot(product, slot))
      .map((product) => ({
        handle: product.handle,
        title: product.title,
        variantId: variantOf(product).id,
        image: product.featuredImage ?? product.images[0] ?? null,
        stock: stock[variantOf(product).id] ?? null,
      }))
      .filter((option) => option.stock !== 0),
  );
}

type PackLine = { merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] };

// Limite de cada linha do carrinho pelo stock dos itens dos packs (o browser não é de confiança).
// O mesmo produto pode estar solto e/ou escolhido em vários packs, por isso conta o carrinho todo:
// por linha devolve o máximo que ela pode ter (null = os packs não a limitam) e o erro, se a
// escolha do pack for inválida ou um item já não tiver stock.
export async function packLimits(lines: PackLine[]): Promise<{ max: number | null; error: string | null }[]> {
  const packs = (await getProducts(20, { query: 'product_type:Pack' })).products.filter(
    (product) => product.packSlots.length,
  );
  const optionsByPack = new Map<string, Promise<PackOption[][]>>();
  const stock = new Map<string, number | null>(); // variante → stock
  // Unidades de cada variante que 1 unidade da linha consome (linha solta = ela própria).
  const uses = await Promise.all(
    lines.map(async (line) => {
      const use = new Map<string, number>();
      const pack = packs.find((product) => product.variants.some((variant) => variant.id === line.merchandiseId));
      if (!pack) return { use: use.set(line.merchandiseId, 1), error: null };
      if (!optionsByPack.has(pack.id)) optionsByPack.set(pack.id, getPackOptions(pack.packSlots));
      const options = await optionsByPack.get(pack.id)!;
      const keys = slotKeys(pack.packSlots);
      const attributes = line.attributes ?? [];
      if (attributes.length !== keys.length) return { use, error: `${pack.title}: escolhe todos os itens do pack` };
      for (const [index, key] of keys.entries()) {
        const value = attributes.find((attribute) => attribute.key === key)?.value;
        const option = options[index].find((candidate) => candidate.title === value);
        if (!option) return { use, error: `${pack.title}: ${value ?? key} já não está disponível` };
        use.set(option.variantId, (use.get(option.variantId) ?? 0) + 1);
        stock.set(option.variantId, option.stock);
      }
      return { use, error: null };
    }),
  );
  return uses.map(({ use, error }, index) => {
    if (error) return { max: 0, error };
    let max: number | null = null;
    for (const [variantId, perUnit] of use) {
      const available = stock.get(variantId);
      if (available == null) continue;
      const others = uses.reduce(
        (sum, other, j) => (j === index ? sum : sum + (other.use.get(variantId) ?? 0) * lines[j].quantity),
        0,
      );
      const fit = Math.max(0, Math.floor((available - others) / perUnit));
      max = max == null ? fit : Math.min(max, fit);
    }
    return { max, error: null };
  });
}
