'use client';

import { useCart } from '@/components/cart-context';
import { useToast } from '@/components/Toast/Toast';
import { useT } from '@/components/LanguageProvider';
import { ecommerceEvent } from '@/lib/analytics';

// Adiciona vários produtos ao carrinho de uma vez ("Leva junto" da PDP e banner do pack).
export default function BundleAddButton({
  variantIds,
  label,
  className = 'btn btn--orange btn--block',
}: {
  variantIds: string[];
  label: string;
  className?: string;
}) {
  const { addItem, loading } = useCart();
  const toast = useToast();
  const t = useT();

  const addAll = async () => {
    const { ok, error, cart } = await addItem(variantIds);
    if (!ok) return toast.show(error ?? t.product.addError, 'error');
    // 1 unidade de cada; nome e preço vêm das linhas do carrinho devolvido.
    const lines = cart?.lines.filter((line) => variantIds.includes(line.merchandise.id)) ?? [];
    ecommerceEvent(
      'add_to_cart',
      lines.map((line) => ({
        item_id: line.merchandise.product.id,
        item_name: line.merchandise.product.title,
        price: Number(line.merchandise.price.amount),
        quantity: 1,
      })),
      {
        value: lines.reduce((sum, line) => sum + Number(line.merchandise.price.amount), 0),
        currency: lines[0]?.merchandise.price.currencyCode ?? 'EUR',
      },
    );
  };

  return (
    <button type="button" className={className} disabled={loading} onClick={addAll}>
      <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
      {loading ? t.product.adding : label}
    </button>
  );
}
