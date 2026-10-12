'use client';

import { useState, type FormEvent } from 'react';
import { useCart } from '@/components/cart-context';
import { useToast } from '@/components/Toast/Toast';
import { useT } from '@/components/LanguageProvider';
import { formatMoney } from '@/lib/format';
import './DiscountForm.scss';

// Campo de código de desconto + lista dos códigos já aplicados ao carrinho.
export default function DiscountForm() {
  const { cart, applyDiscount, loading } = useCart();
  const t = useT();
  const toast = useToast();
  const [code, setCode] = useState('');
  const appliedCodes = (cart?.discountCodes ?? []).filter((discount) => discount.applicable);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) return;
    const isApplied = await applyDiscount(trimmedCode);
    toast.show(isApplied ? t.cart.discountApplied : t.cart.discountError, isApplied ? 'success' : 'error');
    setCode('');
  };

  return (
    <>
      <form className="discount" onSubmit={submit}>
        <input
          className="discount__input"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t.cart.discountLabel}
          aria-label={t.cart.discountLabel}
        />
        <button type="submit" className="btn btn--outline btn--compact" disabled={loading}>
          {t.cart.discountApply}
        </button>
      </form>
      {appliedCodes.map((discount) => (
        <p key={discount.label ?? discount.code} className="discount__applied">
          <span>
            <i className="fa-solid fa-tag" aria-hidden="true" /> {discount.label ?? discount.code}
          </span>
          {discount.amount && <span>−{formatMoney(discount.amount)}</span>}
        </p>
      ))}
    </>
  );
}
