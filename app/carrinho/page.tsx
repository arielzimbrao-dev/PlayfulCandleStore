'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart-context';
import { useT } from '@/components/LanguageProvider';
import { formatMoney } from '@/lib/format';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import LineQuantity from '@/components/cart/LineQuantity/LineQuantity';
import DiscountForm from '@/components/cart/DiscountForm/DiscountForm';
import CheckoutButton from '@/components/cart/CheckoutButton/CheckoutButton';
import TrustList from '@/components/cart/TrustList/TrustList';
import './cart-page.scss';

export default function CartPage() {
  const { cart, ready } = useCart();
  const t = useT();
  const breadcrumbs = [
    { name: 'Início', url: '/' },
    { name: t.cart.title, url: '/carrinho' },
  ];

  // Sem isto, o carrinho pisca "vazio" a cada recarregamento enquanto o GET não responde.
  if (!ready) return <section className="container cart-page cart-page--loading" aria-busy="true" />;

  if (!cart || cart.lines.length === 0) {
    return (
      <section className="container cart-empty">
        <Breadcrumbs items={breadcrumbs} />
        <span className="cart-empty__icon" aria-hidden="true">
          🕯️
        </span>
        <h1 className="script-title">
          <TwoToneTitle text={t.cart.title} />
        </h1>
        <p className="cart-empty__message">
          {t.cart.empty} {t.cart.emptyCta}
        </p>
        <Link className="btn btn--primary btn--large" href="/produtos">
          {t.cart.browse}
        </Link>
        <TrustList items={['shipping', 'delivery', 'easyReturns', 'securePay']} inline />
      </section>
    );
  }

  return (
    <section className="container cart-page">
      <Breadcrumbs items={breadcrumbs} />
      <div className="section__head">
        <h1 className="script-title">
          <TwoToneTitle text={t.cart.title} />
        </h1>
      </div>
      <div className="cart-page__grid">
        <ul className="cart-page__lines">
          {cart.lines.map((line) => {
            const product = line.merchandise.product;
            const productHref = `/produtos/${product.handle}`;
            return (
              <li key={line.id} className="cart-line">
                <Link href={productHref} className="cart-line__thumb">
                  {product.featuredImage ? (
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText ?? product.title}
                      title={product.featuredImage.altText ?? product.title}
                      width={88}
                      height={88}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span aria-hidden="true">🕯️</span>
                  )}
                </Link>
                <div className="cart-line__info">
                  <Link href={productHref} className="cart-line__name">
                    {product.title}
                  </Link>
                  {/* "Default Title" é o nome que a Shopify dá a produtos sem variantes. */}
                  {line.merchandise.title !== 'Default Title' && <small>{line.merchandise.title}</small>}
                  <LineQuantity line={line} />
                </div>
                <span className="cart-line__price">{formatMoney(line.cost.subtotalAmount)}</span>
              </li>
            );
          })}
        </ul>

        <aside className="cart-page__summary">
          <DiscountForm />

          <p className="cart-page__total">
            <span>{t.cart.total}</span>
            <strong>{formatMoney(cart.cost.totalAmount)}</strong>
          </p>
          <CheckoutButton cart={cart} />
          <Link href="/produtos" className="cart-page__continue">
            ← {t.cart.browse}
          </Link>
          <TrustList items={['shipping', 'securePay', 'easyReturns']} />
        </aside>
      </div>
    </section>
  );
}
