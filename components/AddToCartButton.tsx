'use client';

import { useState } from 'react';
import { useCart } from './cart-context';
import { useToast } from './Toast';
import { useT } from './LanguageProvider';
import { formatMoney } from '@/lib/format';
import { ecommerceEvent } from '@/lib/analytics';
import { SITE } from '@/lib/site';
import type { Product } from '@/lib/shopify/types';

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem, loading } = useCart();
  const toast = useToast();
  const t = useT();
  const variants = product.variants;
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? '');
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);

  if (variants.length === 0) return <p>Produto indisponível.</p>;

  const variant = variants.find((v) => v.id === variantId) ?? firstAvailable;
  const soldOut = !variant?.availableForSale;
  const onSale =
    !!variant?.compareAtPrice && Number(variant.compareAtPrice.amount) > Number(variant.price.amount);

  const track = () => {
    if (!variant) return;
    ecommerceEvent('add_to_cart', [
      { item_id: product.id, item_name: product.title, price: Number(variant.price.amount), quantity: qty, item_category: product.productType },
    ]);
  };

  const handleAdd = async () => {
    if (!variant) return;
    const ok = await addItem(variant.id, qty);
    toast.show(ok ? `${product.title} — ${t.product.added}` : t.product.addError, ok ? 'success' : 'error');
    if (ok) track();
  };

  // Comprar agora: cria/atualiza o carrinho e vai direto ao checkout do Shopify (que oferece Shop Pay).
  const buyNow = async () => {
    if (!variant) return;
    setBuying(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchandiseId: variant.id, quantity: qty, buyNow: true }),
      });
      const data = (await res.json()) as { cart?: { checkoutUrl?: string } };
      if (data.cart?.checkoutUrl) {
        track();
        window.location.href = data.cart.checkoutUrl;
        return;
      }
      toast.show(t.product.addError, 'error');
    } catch {
      toast.show(t.product.addError, 'error');
    }
    setBuying(false);
  };

  const notifyHref = `${SITE.whatsapp}?text=${encodeURIComponent(`Olá! Avisem-me quando "${product.title}" voltar ao stock 🕯️`)}`;

  return (
    <div className="buybox">
      <div className="buybox__toprow">
        <div className="buybox__price">
          {variant && (
            <span className={`price${onSale ? ' price--sale' : ''}`} style={{ fontSize: '1.7rem' }}>
              {formatMoney(variant.price)}
            </span>
          )}
          {onSale && variant?.compareAtPrice && (
            <span className="price-old" style={{ fontSize: '1.1rem' }}>{formatMoney(variant.compareAtPrice)}</span>
          )}
        </div>
        {!soldOut && (
          <div className="qty" aria-label="Quantidade">
            <button type="button" aria-label="Diminuir quantidade" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span aria-live="polite">{qty}</span>
            <button type="button" aria-label="Aumentar quantidade" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
          </div>
        )}
      </div>

      {!soldOut && (
        <p className="buybox__stock">
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          {t.product.inStock}
        </p>
      )}

      {variants.length > 1 && (
        <label className="buybox__field">
          <span>Opção</span>
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={!v.availableForSale}>
                {v.title}
                {v.availableForSale ? '' : ` — ${t.product.soldout}`}
              </option>
            ))}
          </select>
        </label>
      )}

      {soldOut ? (
        <a className="buybox__cta buybox__cta--cart" href={notifyHref} target="_blank" rel="noopener noreferrer">
          {t.product.notify}
          <i className="fa-solid fa-bell" aria-hidden="true" />
        </a>
      ) : (
        <>
          <button className="buybox__cta buybox__cta--cart" disabled={loading || buying || !variant} onClick={handleAdd}>
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
            {loading ? t.product.adding : t.product.choose}
          </button>
          <button className="buybox__cta buybox__cta--buy" disabled={buying || loading || !variant} onClick={buyNow}>
            <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
            {buying ? t.product.adding : t.product.buyNow}
          </button>
        </>
      )}

      {/* barra fixa de compra no mobile (mantém o CTA sempre visível) */}
      <div className="buybar-m">
        {variant && <span className="buybar-m__price">{formatMoney(variant.price)}</span>}
        {soldOut ? (
          <a className="btn btn--primary buybar-m__btn" href={notifyHref} target="_blank" rel="noopener noreferrer">
            {t.product.notify} <i className="fa-solid fa-bell" aria-hidden="true" />
          </a>
        ) : (
          <button className="btn btn--primary buybar-m__btn" disabled={loading || buying || !variant} onClick={handleAdd}>
            {loading ? t.product.adding : t.product.choose} <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
