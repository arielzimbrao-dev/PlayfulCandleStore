'use client';

import { useCart } from '@/components/cart-context';
import { useToast } from '@/components/Toast/Toast';
import { useT } from '@/components/LanguageProvider';

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
    const isAdded = await addItem(variantIds);
    if (!isAdded) toast.show(t.product.addError, 'error');
  };

  return (
    <button type="button" className={className} disabled={loading} onClick={addAll}>
      <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
      {loading ? t.product.adding : label}
    </button>
  );
}
