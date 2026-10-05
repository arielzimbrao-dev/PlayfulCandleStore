'use client';

import { useCart } from './cart-context';
import { useToast } from './Toast';
import { useT } from './LanguageProvider';
import { ecommerceEvent } from '@/lib/analytics';
import type { Product } from '@/lib/shopify/types';

// Botão-ícone "Adicionar ao carrinho" (círculo branco, como o coração) para os cards dos carrosséis (adiciona a 1ª variante disponível).
// Leaf client dentro do ProductCardBig (que continua server-rendered).
export default function AddToCartMini({ product }: { product: Product }) {
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
      disabled={loading || !variant}
      onClick={add}
      aria-label={`${t.product.choose}: ${product.title}`}
      title={t.product.choose}
    >
      <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
    </button>
  );
}
