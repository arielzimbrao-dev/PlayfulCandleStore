'use client';

import { useT } from '@/components/LanguageProvider';
import { ecommerceEvent } from '@/lib/analytics';
import type { Cart } from '@/lib/shopify/types';
import './CheckoutButton.scss';

// Botão "Finalizar compra": leva ao checkout da Shopify e registra o begin_checkout no analytics.
export default function CheckoutButton({ cart }: { cart: Cart }) {
  const t = useT();

  const trackBeginCheckout = () => {
    ecommerceEvent(
      'begin_checkout',
      cart.lines.map((line) => ({
        item_id: line.merchandise.product.id, // mesmo ID do view_item/add_to_cart (produto, não variante)
        item_name: line.merchandise.product.title,
        price: Number(line.merchandise.price.amount),
        quantity: line.quantity,
      })),
      { value: Number(cart.cost.totalAmount.amount) },
    );
  };

  return (
    <a className="checkout-button" href={cart.checkoutUrl} onClick={trackBeginCheckout}>
      {t.cart.checkout}
    </a>
  );
}
