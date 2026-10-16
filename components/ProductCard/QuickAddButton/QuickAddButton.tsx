'use client';

import Link from 'next/link';
import { useCart } from '@/components/cart-context';
import { useToast } from '@/components/Toast/Toast';
import { useT } from '@/components/LanguageProvider';
import { ecommerceEvent } from '@/lib/analytics';
import type { Product } from '@/lib/shopify/types';
import './QuickAddButton.scss';

// Botão "Adicionar ao carrinho" dos cards: adiciona 1 unidade da 1.ª variante disponível.
// É a única parte client do ProductCard (que continua renderizado no servidor).
export default function QuickAddButton({
  product,
  isSoldOut = false,
  soldOutLabel,
}: {
  product: Product;
  isSoldOut?: boolean;
  soldOutLabel?: string;
}) {
  const { addItem, loading } = useCart();
  const toast = useToast();
  const t = useT();
  const variant = product.variants.find((candidate) => candidate.availableForSale) ?? product.variants[0];

  // Pack de escolha: os itens escolhem-se na página do produto.
  if (product.packSlots.length && !isSoldOut) {
    return (
      <Link href={`/produtos/${product.handle}`} className="quick-add">
        <i className="fa-solid fa-gift" aria-hidden="true" /> Montar o pack
      </Link>
    );
  }

  const addToCart = async () => {
    if (!variant) return;
    const { ok, error } = await addItem(variant.id, 1);
    toast.show(ok ? `${product.title} — ${t.product.added}` : (error ?? t.product.addError), ok ? 'success' : 'error');
    if (ok) {
      ecommerceEvent(
        'add_to_cart',
        [
          {
            item_id: product.id,
            item_name: product.title,
            price: Number(variant.price.amount),
            quantity: 1,
            item_category: product.productType,
          },
        ],
        { value: Number(variant.price.amount), currency: variant.price.currencyCode },
      );
    }
  };

  return (
    <button
      type="button"
      className={`quick-add${isSoldOut ? ' quick-add--sold-out' : ''}`}
      disabled={isSoldOut || loading || !variant}
      onClick={addToCart}
      aria-label={isSoldOut ? undefined : `${t.product.choose}: ${product.title}`}
    >
      {isSoldOut ? (
        (soldOutLabel ?? t.product.soldout)
      ) : (
        <>
          <i className="fa-solid fa-cart-shopping" aria-hidden="true" /> {t.product.choose}
        </>
      )}
    </button>
  );
}
