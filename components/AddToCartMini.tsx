'use client';

import { useCart } from './cart-context';
import { useToast } from './Toast';
import { useT } from './LanguageProvider';
import { ecommerceEvent } from '@/lib/analytics';
import type { Product } from '@/lib/shopify/types';

// Botão "Adicionar ao carrinho" (laranja, toda a largura) dos cards — adiciona a 1ª variante disponível.
// Leaf client dentro do ProductCardBig (que continua server-rendered).
export default function AddToCartMini({
  product,
  soldOut = false,
  soldoutLabel,
}: {
  product: Product;
  soldOut?: boolean;
  soldoutLabel?: string;
}) {
  const { addItem, loading } = useCart();
  const toast = useToast();
  const t = useT();
  const variant = product.variants.find((v) => v.availableForSale) ?? product.variants[0];

  const add = async () => {
    if (!variant) return;
    const ok = await addItem(variant.id, 1);
    toast.show(ok ? `${product.title} — ${t.product.added}` : t.product.addError, ok ? 'success' : 'error');
    if (ok) {
      ecommerceEvent('add_to_cart', [
        {
          item_id: product.id,
          item_name: product.title,
          price: Number(variant.price.amount),
          quantity: 1,
          item_category: product.productType,
        },
      ]);
    }
  };

  return (
    <button
      type="button"
      className="bcard__add"
      disabled={soldOut || loading || !variant}
      onClick={add}
      aria-label={soldOut ? undefined : `${t.product.choose}: ${product.title}`}
    >
      {soldOut ? (
        soldoutLabel ?? t.product.soldout
      ) : (
        <>
          <i className="fa-solid fa-cart-shopping" aria-hidden="true" /> {t.product.choose}
        </>
      )}
    </button>
  );
}
