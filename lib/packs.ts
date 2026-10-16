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
        image: product.featuredImage ?? product.images[0] ?? null,
        stock: stock[variantOf(product).id] ?? null,
      }))
      .filter((option) => option.stock !== 0),
  );
}

// Valida a escolha que chega ao carrinho (o browser não é de confiança): um valor por item,
// cada um uma opção válida, e stock que chegue para `quantity` packs. Devolve o erro ou null.
export async function validatePackChoice(
  slots: PackSlot[],
  attributes: { key: string; value: string }[],
  quantity: number,
): Promise<string | null> {
  const options = await getPackOptions(slots);
  const keys = slotKeys(slots);
  if (attributes.length !== keys.length) return 'Escolhe todos os itens do pack';
  const needed = new Map<string, number>();
  for (const [index, key] of keys.entries()) {
    const value = attributes.find((attribute) => attribute.key === key)?.value;
    const option = options[index].find((candidate) => candidate.title === value);
    if (!option) return `${key}: escolha inválida`;
    needed.set(option.handle, (needed.get(option.handle) ?? 0) + quantity);
    if (option.stock != null && needed.get(option.handle)! > option.stock) return `${option.title}: sem stock suficiente`;
  }
  return null;
}
