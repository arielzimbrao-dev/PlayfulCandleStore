'use client';

import { useCart } from '@/components/cart-context';
import { useToast } from '@/components/Toast/Toast';
import { useT } from '@/components/LanguageProvider';

// Adiciona todos os produtos do "Leva junto" ao carrinho de uma vez.
export default function BundleAddButton({ variantIds, label }: { variantIds: string[]; label: string }) {
  const { addItem, loading } = useCart();
  const toast = useToast();
  const t = useT();

  const addAll = async () => {
    const isAdded = await addItem(variantIds);
    if (!isAdded) toast.show(t.product.addError, 'error');
  };

  return (
    <button type="button" className="btn btn--orange btn--block" disabled={loading} onClick={addAll}>
      <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
      {loading ? t.product.adding : label}
    </button>
  );
}
