'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart-context';
import { useToast } from '@/components/Toast';
import { useT } from '@/components/LanguageProvider';
import { formatMoney } from '@/lib/format';
import { ecommerceEvent } from '@/lib/analytics';
import { SITE } from '@/lib/site';

const FREE = SITE.freeShippingThreshold;

export default function CarrinhoPage() {
  const { cart, updateItem, removeItem, applyDiscount, saveNote, loading, ready, pending } = useCart();
  const t = useT();
  const toast = useToast();
  const [code, setCode] = useState('');

  // Sem isto, o carrinho pisca "vazio" a cada recarregamento enquanto o GET não responde.
  if (!ready) return <section className="container cart-page" aria-busy="true" style={{ minHeight: '44vh' }} />;

  if (!cart || cart.lines.length === 0) {
    return (
      <section className="container cart-empty">
        <span className="cart-empty__mark" aria-hidden="true">🕯️</span>
        <h1 className="script-title">{t.cart.title}</h1>
        <p className="cart-empty__msg">{t.cart.empty} {t.cart.emptyCta}</p>
        <Link className="btn btn--primary btn--lg" href="/produtos">{t.cart.browse}</Link>
        <ul className="buybox__trust cart-empty__trust">
          <li><i className="fa-solid fa-truck-fast" aria-hidden="true" />{t.product.freeShip}</li>
          <li><i className="fa-solid fa-clock" aria-hidden="true" />{t.product.delivery}</li>
          <li><i className="fa-solid fa-rotate-left" aria-hidden="true" />{t.product.easyReturns}</li>
          <li><i className="fa-solid fa-lock" aria-hidden="true" />{t.product.securePay}</li>
        </ul>
      </section>
    );
  }

  const subtotal = Number(cart.cost.subtotalAmount.amount);
  const remaining = Math.max(0, FREE - subtotal);
  const pct = Math.min(100, (subtotal / FREE) * 100);
  const applied = (cart.discountCodes ?? []).filter((d) => d.applicable).map((d) => d.code);

  const handleDiscount = async (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    const ok = await applyDiscount(c);
    toast.show(ok ? t.cart.discountApplied : t.cart.discountError, ok ? 'success' : 'error');
    setCode('');
  };

  const handleCheckout = () => {
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
    <section className="container cart-page">
      <div className="sec__head">
        <div>
          <h1 className="script-title">{t.cart.title}</h1>
        </div>
      </div>
      <div className="cart-page__grid">
        <ul className="cart-page__lines">
          {cart.lines.map((line) => (
            <li key={line.id} className="cart-line">
              <Link href={`/produtos/${line.merchandise.product.handle}`} className="cart-line__thumb">
                {line.merchandise.product.featuredImage ? (
                  <Image
                    src={line.merchandise.product.featuredImage.url}
                    alt={line.merchandise.product.featuredImage.altText ?? line.merchandise.product.title}
                    title={line.merchandise.product.title}
                    width={88}
                    height={88}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <span aria-hidden="true">🕯️</span>
                )}
              </Link>
              <div className="cart-line__main">
                <Link href={`/produtos/${line.merchandise.product.handle}`} className="cart-line__name">
                  {line.merchandise.product.title}
                </Link>
                {line.merchandise.title !== 'Default Title' && <small>{line.merchandise.title}</small>}
                <div className="drawer__qty">
                  <button disabled={pending === line.id} onClick={async () => { if (!(await updateItem(line.id, Math.max(1, line.quantity - 1)))) toast.show(t.cart.actionError, 'error'); }} aria-label="−">−</button>
                  <span>{line.quantity}</span>
                  <button disabled={pending === line.id} onClick={async () => { if (!(await updateItem(line.id, line.quantity + 1))) toast.show(t.cart.actionError, 'error'); }} aria-label="+">+</button>
                  <button className="drawer__remove" disabled={pending === line.id} onClick={async () => { if (!(await removeItem(line.id))) toast.show(t.cart.actionError, 'error'); }}>{t.cart.remove}</button>
                </div>
              </div>
              <span className="cart-line__price">{formatMoney(line.cost.totalAmount)}</span>
            </li>
          ))}
        </ul>

        <aside className="cart-page__summary">
          <div className="ship-bar">
            <p className="ship-bar__text">
              <i className="fa-solid fa-truck-fast" aria-hidden="true" />{' '}
              {remaining > 0
                ? t.cart.freeShipLeft(
                    formatMoney({ amount: String(remaining), currencyCode: cart.cost.subtotalAmount.currencyCode }),
                  )
                : t.cart.freeShipDone}
            </p>
            <div className="ship-bar__track"><span style={{ width: `${pct}%` }} /></div>
          </div>

          <form className="discount" onSubmit={handleDiscount}>
            <input className="discount__input" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t.cart.discountLabel} aria-label={t.cart.discountLabel} />
            <button type="submit" className="btn btn--outline discount__btn" disabled={loading}>{t.cart.discountApply}</button>
          </form>
          {applied.length > 0 && <p className="discount__applied"><i className="fa-solid fa-tag" aria-hidden="true" /> {applied.join(', ')}</p>}

          {/* Mensagem de oferta: vai como nota da encomenda (aparece no admin da Shopify). */}
          <details className="giftnote" open={!!cart.note}>
            <summary>{t.cart.giftSummary}</summary>
            <textarea
              className="giftnote__input"
              rows={3}
              maxLength={500}
              defaultValue={cart.note ?? ''}
              placeholder={t.cart.giftPlaceholder}
              aria-label={t.cart.giftLabel}
              onBlur={async (e) => {
                const value = e.target.value.trim();
                if (value === (cart.note ?? '').trim()) return;
                const ok = await saveNote(value);
                toast.show(ok ? t.cart.giftSaved : t.cart.actionError, ok ? 'success' : 'error');
              }}
            />
          </details>

          <p className="cart-page__total"><span>{t.cart.total}</span><strong>{formatMoney(cart.cost.totalAmount)}</strong></p>
          <a className="drawer__checkout" href={cart.checkoutUrl} onClick={handleCheckout}>{t.cart.checkout}</a>
          <Link href="/produtos" className="cart-page__continue">← {t.cart.browse}</Link>
          <ul className="buybox__trust cart-page__trust">
            <li><i className="fa-solid fa-truck-fast" aria-hidden="true" />{t.product.freeShip}</li>
            <li><i className="fa-solid fa-lock" aria-hidden="true" />{t.product.securePay}</li>
            <li><i className="fa-solid fa-rotate-left" aria-hidden="true" />{t.product.easyReturns}</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
