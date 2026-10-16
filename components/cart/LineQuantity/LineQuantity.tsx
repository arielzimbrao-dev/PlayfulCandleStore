'use client';

import { useCart, type CartResult } from '@/components/cart-context';
import { useToast } from '@/components/Toast/Toast';
import { useT } from '@/components/LanguageProvider';
import type { CartLine } from '@/lib/shopify/types';
import './LineQuantity.scss';

// Controles de uma linha do carrinho: − quantidade + e "Remover".
// Só a linha em atualização fica bloqueada (as outras continuam clicáveis).
export default function LineQuantity({ line }: { line: CartLine }) {
  const { updateItem, removeItem, pending } = useCart();
  const toast = useToast();
  const t = useT();
  const isUpdating = pending === line.id;
  const stockLimit = line.merchandise.quantityAvailable ?? Infinity;

  const title = line.merchandise.product.title;

  // Mostra um aviso se a ação falhar: a mensagem da API (ex.: stock do pack) ou a genérica.
  const run = async (action: () => Promise<CartResult>) => {
    const { ok, error } = await action();
    if (!ok) toast.show(error ?? t.cart.actionError, 'error');
  };

  return (
    <div className="line-quantity">
      <button
        className="line-quantity__step"
        disabled={isUpdating}
        onClick={() => run(() => updateItem(line.id, Math.max(1, line.quantity - 1)))}
        aria-label={`Diminuir quantidade de ${title}`}
      >
        −
      </button>
      <span aria-live="polite">{line.quantity}</span>
      <button
        className="line-quantity__step"
        disabled={isUpdating || line.quantity >= stockLimit}
        onClick={() => run(() => updateItem(line.id, line.quantity + 1))}
        aria-label={`Aumentar quantidade de ${title}`}
      >
        +
      </button>
      <button className="line-quantity__remove" disabled={isUpdating} onClick={() => run(() => removeItem(line.id))}>
        {t.cart.remove}
      </button>
    </div>
  );
}
