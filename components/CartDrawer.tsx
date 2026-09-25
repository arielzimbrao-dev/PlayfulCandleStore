'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useCart } from './cart-context';
import { useToast } from './Toast';
import { useT } from './LanguageProvider';
import { formatMoney } from '@/lib/format';
import { ecommerceEvent } from '@/lib/analytics';
import { SITE } from '@/lib/site';

const FREE_SHIPPING_THRESHOLD = SITE.freeShippingThreshold;

export default function CartDrawer() {
  const { cart, isOpen, closeCart, updateItem, removeItem, applyDiscount, loading, pending } = useCart();
  const t = useT();
  const toast = useToast();
  const [code, setCode] = useState('');
  const empty = !cart || cart.lines.length === 0;
  const drawerRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // On open: remember what had focus and move focus into the drawer.
  // On close: restore focus to the opener (usually the cart button in the header).
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement as HTMLElement | null;
      closeBtnRef.current?.focus();
    } else {
      openerRef.current?.focus();
      openerRef.current = null;
    }
  }, [isOpen]);

  // Escape closes; Tab/Shift-Tab wrap focus within the drawer (same pattern as SearchBox).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart();
        return;
      }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, closeCart]);

  const subtotal = cart ? Number(cart.cost.subtotalAmount.amount) : 0;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const appliedCodes = (cart?.discountCodes ?? []).filter((d) => d.applicable).map((d) => d.code);

  const handleDiscount = async (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    const ok = await applyDiscount(c);
    toast.show(ok ? t.cart.discountApplied : t.cart.discountError, ok ? 'success' : 'error');
    setCode('');
  };

  const handleCheckout = () => {
    if (!cart) return;
    ecommerceEvent(
      'begin_checkout',
      cart.lines.map((l) => ({
        item_id: l.merchandise.product.id, // mesmo ID que view_item/add_to_cart (produto, não variante)
        item_name: l.merchandise.product.title,
        price: Number(l.merchandise.price.amount),
        quantity: l.quantity,
      })),
      { value: Number(cart.cost.totalAmount.amount) },
    );
  };

  return (
    <>
      <div className={`drawer__overlay${isOpen ? ' is-open' : ''}`} onClick={closeCart} aria-hidden={!isOpen} />
      <aside
        ref={drawerRef}
        className={`drawer${isOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t.cart.title}
        aria-hidden={!isOpen}
      >
        <header className="drawer__header">
          <strong>{t.cart.title}</strong>
          <button ref={closeBtnRef} onClick={closeCart} aria-label={t.cart.close}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </header>

        {empty ? (
          <p className="drawer__empty">{t.cart.empty}</p>
        ) : (
          <>
            <div className="ship-bar">
              <p className="ship-bar__text">
                <i className="fa-solid fa-truck-fast" aria-hidden="true" />{' '}
                {remaining > 0
                  ? t.cart.freeShipLeft(
                      formatMoney({ amount: String(remaining), currencyCode: cart!.cost.subtotalAmount.currencyCode }),
                    )
                  : t.cart.freeShipDone}
              </p>
              <div className="ship-bar__track"><span style={{ width: `${pct}%` }} /></div>
            </div>

            <ul className="drawer__lines">
              {cart.lines.map((line) => (
                <li key={line.id} className="drawer__line">
                  <span className="drawer__thumb">
                    {line.merchandise.product.featuredImage ? (
                      <Image
                        src={line.merchandise.product.featuredImage.url}
                        alt={line.merchandise.product.featuredImage.altText ?? line.merchandise.product.title}
                        title={line.merchandise.product.title}
                        width={56}
                        height={56}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <span aria-hidden="true">🕯️</span>
                    )}
                  </span>
                  <div className="drawer__line-main">
                    <p>{line.merchandise.product.title}</p>
                    {line.merchandise.title !== 'Default Title' && <small>{line.merchandise.title}</small>}
                    <div className="drawer__qty">
                      <button disabled={pending === line.id} onClick={async () => { if (!(await updateItem(line.id, Math.max(1, line.quantity - 1)))) toast.show(t.cart.actionError, 'error'); }} aria-label="−">−</button>
                      <span>{line.quantity}</span>
                      <button disabled={pending === line.id} onClick={async () => { if (!(await updateItem(line.id, line.quantity + 1))) toast.show(t.cart.actionError, 'error'); }} aria-label="+">+</button>
                      <button className="drawer__remove" disabled={pending === line.id} onClick={async () => { if (!(await removeItem(line.id))) toast.show(t.cart.actionError, 'error'); }}>{t.cart.remove}</button>
                    </div>
                  </div>
                  <span className="drawer__line-price">{formatMoney(line.cost.totalAmount)}</span>
                </li>
              ))}
            </ul>

            <footer className="drawer__footer">
              <form className="discount" onSubmit={handleDiscount}>
                <input
                  className="discount__input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t.cart.discountLabel}
                  aria-label={t.cart.discountLabel}
                />
                <button type="submit" className="btn btn--outline discount__btn" disabled={loading}>{t.cart.discountApply}</button>
              </form>
              {appliedCodes.length > 0 && (
                <p className="discount__applied"><i className="fa-solid fa-tag" aria-hidden="true" /> {appliedCodes.join(', ')}</p>
              )}
              <p>
                <span>{t.cart.total}</span>
                <strong>{formatMoney(cart.cost.totalAmount)}</strong>
              </p>
              <a className="drawer__checkout" href={cart.checkoutUrl} onClick={handleCheckout}>{t.cart.checkout}</a>
              <ul className="buybox__trust drawer__trust">
                <li><i className="fa-solid fa-truck-fast" aria-hidden="true" />{t.product.freeShip}</li>
                <li><i className="fa-solid fa-lock" aria-hidden="true" />{t.product.securePay}</li>
              </ul>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
