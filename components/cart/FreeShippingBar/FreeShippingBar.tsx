'use client';

import { useT } from '@/components/LanguageProvider';
import { formatMoney } from '@/lib/format';
import { SITE } from '@/lib/site';
import type { Money } from '@/lib/shopify/types';
import './FreeShippingBar.scss';

// Barra de progresso até o frete grátis ("Faltam €X para portes grátis").
export default function FreeShippingBar({ subtotal }: { subtotal: Money }) {
  const t = useT();
  const subtotalValue = Number(subtotal.amount);
  const missing = Math.max(0, SITE.freeShippingThreshold - subtotalValue);
  const progressPercent = Math.min(100, (subtotalValue / SITE.freeShippingThreshold) * 100);

  return (
    <div className="free-shipping">
      <p className="free-shipping__text">
        <i className="fa-solid fa-truck-fast" aria-hidden="true" />{' '}
        {missing > 0
          ? t.cart.freeShipLeft(formatMoney({ amount: String(missing), currencyCode: subtotal.currencyCode }))
          : t.cart.freeShipDone}
      </p>
      <div className="free-shipping__track">
        <span style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}
