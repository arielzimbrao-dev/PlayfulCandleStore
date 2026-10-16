'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart-context';
import { useT } from '@/components/LanguageProvider';
import { formatMoney } from '@/lib/format';
import LineQuantity from '@/components/cart/LineQuantity/LineQuantity';
import DiscountForm from '@/components/cart/DiscountForm/DiscountForm';
import CheckoutButton from '@/components/cart/CheckoutButton/CheckoutButton';
import TrustList from '@/components/cart/TrustList/TrustList';
import ShippingNote from '@/components/ShippingNote/ShippingNote';
import QuickAddButton from '@/components/ProductCard/QuickAddButton/QuickAddButton';
import type { Product } from '@/lib/shopify/types';
import './CartDrawer.scss';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Gaveta do carrinho que desliza da direita. Fica sempre montada (para a animação de saída);
// abre quando um produto é adicionado ou pelo ícone do carrinho no header.
// shippingFrom: portes desde (€); suggestions: mais vendidos (o mesmo fallback do "Compra também"
// da PDP), dos quais mostra até 3 que ainda não estão no carrinho.
export default function CartDrawer({ shippingFrom, suggestions = [] }: { shippingFrom?: number; suggestions?: Product[] }) {
  const { cart, isOpen, closeCart, pending } = useCart();
  const t = useT();
  // Linha "fantasma" enquanto um produto novo está a ser adicionado (a gaveta abre antes da resposta).
  const isAdding = pending === 'cart';
  const isEmpty = (!cart || cart.lines.length === 0) && !isAdding;
  const inCart = new Set(cart?.lines.map((line) => line.merchandise.product.id));
  const crossSell = suggestions.filter((product) => !inCart.has(product.id)).slice(0, 3);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Ao abrir: guarda quem tinha o foco e leva o foco para dentro da gaveta.
  // Ao fechar: devolve o foco para quem abriu (normalmente o botão do carrinho no header).
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
    } else {
      openerRef.current?.focus();
      openerRef.current = null;
    }
  }, [isOpen]);

  // Esc fecha; Tab/Shift+Tab ficam presos dentro da gaveta (acessibilidade de diálogo modal).
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCart();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusables = drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeCart]);

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
          <button ref={closeButtonRef} className="drawer__close" onClick={closeCart} aria-label={t.cart.close}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </header>

        {isEmpty ? (
          <div className="drawer__empty">
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
            <p className="drawer__empty-message">{t.cart.empty}</p>  
          </div>
        ) : (
          <div className="drawer__content">

            <ul className="drawer__lines" aria-busy={isAdding}>
              {cart?.lines.map((line) => {
                const product = line.merchandise.product;
                const productHref = `/produtos/${product.handle}`;
                return (
                  <li key={line.id} className="drawer__line">
                    <Link href={productHref} className="drawer__thumb" onClick={closeCart} tabIndex={-1} aria-hidden="true">
                      {product.featuredImage ? (
                        <Image
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText ?? product.title}
                          title={product.featuredImage.altText ?? product.title}
                          width={56}
                          height={56}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <span aria-hidden="true">🕯️</span>
                      )}
                    </Link>
                    <div className="drawer__line-info">
                      <Link href={productHref} className="drawer__line-name" onClick={closeCart}>
                        {product.title}
                      </Link>
                      {/* "Default Title" é o nome que a Shopify dá a produtos sem variantes. */}
                      {line.merchandise.title !== 'Default Title' && <small>{line.merchandise.title}</small>}
                      {/* Itens escolhidos num pack (propriedades da linha). */}
                      {line.attributes.length > 0 && (
                        <small>{line.attributes.map((attribute) => `${attribute.key}: ${attribute.value}`).join(' · ')}</small>
                      )}
                      <LineQuantity line={line} />
                    </div>
                    <span className="drawer__line-price">{formatMoney(line.cost.subtotalAmount)}</span>
                  </li>
                );
              })}
              {isAdding && (
                <li className="drawer__line" aria-label={t.product.adding}>
                  <span className="drawer__thumb skeleton" />
                  <span className="drawer__line-info">
                    <span className="skeleton drawer__skeleton-text" />
                    <span className="skeleton drawer__skeleton-text drawer__skeleton-text--short" />
                  </span>
                </li>
              )}
            </ul>

            {crossSell.length > 0 && (
              <section className="drawer__suggestions" aria-labelledby="drawer-suggestions-title">
                <h2 id="drawer-suggestions-title" className="drawer__suggestions-title">Leva também</h2>
                <ul>
                  {crossSell.map((product) => {
                    const image = product.featuredImage ?? product.images[0];
                    return (
                      <li key={product.id} className="drawer__suggestion">
                        <Link href={`/produtos/${product.handle}`} className="drawer__thumb" onClick={closeCart} tabIndex={-1} aria-hidden="true">
                          {image && <Image src={image.url} alt="" width={56} height={56} style={{ objectFit: 'cover' }} />}
                        </Link>
                        <div className="drawer__line-info">
                          <Link href={`/produtos/${product.handle}`} className="drawer__line-name" onClick={closeCart}>
                            {product.title}
                          </Link>
                          <small>{formatMoney(product.priceRange.minVariantPrice)}</small>
                        </div>
                        <QuickAddButton product={product} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <footer className="drawer__footer">
              <DiscountForm />
              <p className="drawer__total">
                <span>{t.cart.total}</span>
                <strong>{cart ? formatMoney(cart.cost.totalAmount) : '—'}</strong>
              </p>
              <ShippingNote from={shippingFrom} cart onNavigate={closeCart} />
              {cart && <CheckoutButton cart={cart} />}
              <TrustList items={['shipping', 'securePay']} />
            </footer>
          </div>
        )}
      </aside>
    </>
  );
}
