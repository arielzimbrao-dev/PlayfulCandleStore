'use client';

import { useCart } from './cart-context';
import { useToast } from './Toast';
import { useT } from './LanguageProvider';

export default function BundleAddButton({ variantIds, label }: { variantIds: string[]; label: string }) {
  const { addItem, loading } = useCart();
  const toast = useToast();
  const t = useT();
  return (
    <button
      type="button"
      className="buybox__cta buybox__cta--cart"
      disabled={loading}
      onClick={async () => {
        if (!(await addItem(variantIds))) toast.show(t.product.addError, 'error');
      }}
    >
      <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
      {loading ? t.product.adding : label}
    </button>
  );
}
