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
import './CartDrawer.scss';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Gaveta do carrinho que desliza da direita. Fica sempre montada (para a animação de saída);
// abre quando um produto é adicionado ou pelo ícone do carrinho no header.
export default function CartDrawer() {
  const { cart, isOpen, closeCart } = useCart();
  const t = useT();
  const isEmpty = !cart || cart.lines.length === 0;
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

            <ul className="drawer__lines">
              {cart.lines.map((line) => {
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
                      <LineQuantity line={line} />
                    </div>
                    <span className="drawer__line-price">{formatMoney(line.cost.subtotalAmount)}</span>
                  </li>
                );
              })}
            </ul>

            <footer className="drawer__footer">
              <DiscountForm />
              <p className="drawer__total">
                <span>{t.cart.total}</span>
                <strong>{formatMoney(cart.cost.totalAmount)}</strong>
              </p>
              <CheckoutButton cart={cart} />
              <TrustList items={['shipping', 'securePay']} />
            </footer>
          </div>
        )}
      </aside>
    </>
  );
}
