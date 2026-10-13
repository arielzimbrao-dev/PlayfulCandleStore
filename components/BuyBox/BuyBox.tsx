'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/cart-context';
import { useToast } from '@/components/Toast/Toast';
import { useT } from '@/components/LanguageProvider';
import { formatMoney } from '@/lib/format';
import { ecommerceEvent } from '@/lib/analytics';
import { SITE } from '@/lib/site';
import type { Product } from '@/lib/shopify/types';
import './BuyBox.scss';

// Quantidade máxima quando a Shopify não informa o estoque.
const UNLIMITED_STOCK = 99;

// Caixa de compra da PDP: preço, quantidade, variante e os botões
// "Adicionar ao carrinho" + "Comprar agora". No celular há também uma barra fixa no rodapé.
export default function BuyBox({ product }: { product: Product }) {
  const { cart, addItem, loading } = useCart();
  const toast = useToast();
  const t = useT();
  const variants = product.variants;
  const firstAvailable = variants.find((variant) => variant.availableForSale) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  // Barra fixa do celular: só aparece depois de o botão principal sair do ecrã por cima
  // (antes disso ele já está à vista e a barra só taparia conteúdo).
  const mainActionsRef = useRef<HTMLDivElement>(null);
  const [isBarVisible, setIsBarVisible] = useState(false);

  useEffect(() => {
    const target = mainActionsRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (variants.length === 0) return <p>Produto indisponível.</p>;

  const variant = variants.find((candidate) => candidate.id === variantId) ?? firstAvailable;
  // Limite = estoque menos o que já está no carrinho (quantityAvailable null = sem limite).
  const quantityInCart =
    cart?.lines.find((line) => line.merchandise.id === variant?.id)?.quantity ?? 0;
  const maxQuantity =
    variant?.quantityAvailable == null
      ? UNLIMITED_STOCK
      : Math.max(0, variant.quantityAvailable - quantityInCart);
  const isSoldOut = !variant?.availableForSale || variant.quantityAvailable === 0;
  const safeQuantity = Math.min(quantity, Math.max(1, maxQuantity));
  const isOnSale =
    !!variant?.compareAtPrice &&
    Number(variant.compareAtPrice.amount) > Number(variant.price.amount);
  const canAdd = !loading && !isBuyingNow && !!variant && maxQuantity > 0;

  const trackAddToCart = () => {
    if (!variant) return;
    ecommerceEvent('add_to_cart', [
      {
        item_id: product.id,
        item_name: product.title,
        price: Number(variant.price.amount),
        quantity: safeQuantity,
        item_category: product.productType,
      },
    ]);
  };

  const addToCart = async () => {
    if (!variant) return;
    const isAdded = await addItem(variant.id, safeQuantity);
    toast.show(
      isAdded ? `${product.title} — ${t.product.added}` : t.product.addError,
      isAdded ? 'success' : 'error',
    );
    if (isAdded) trackAddToCart();
  };

  // "Comprar agora": cria/atualiza o carrinho e vai direto para o checkout da Shopify (que oferece Shop Pay).
  const buyNow = async () => {
    if (!variant) return;
    setIsBuyingNow(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchandiseId: variant.id,
          quantity: Math.min(quantity, variant.quantityAvailable ?? UNLIMITED_STOCK),
          buyNow: true,
        }),
      });
      const data = (await response.json()) as { cart?: { checkoutUrl?: string } };
      if (data.cart?.checkoutUrl) {
        trackAddToCart();
        window.location.href = data.cart.checkoutUrl;
        return;
      }
      toast.show(t.product.addError, 'error');
    } catch {
      toast.show(t.product.addError, 'error');
    }
    setIsBuyingNow(false);
  };

  // Esgotado: o botão abre o WhatsApp com uma mensagem pronta pedindo aviso de reposição.
  const notifyMeHref = `${SITE.whatsapp}?text=${encodeURIComponent(
    `Olá! Avisem-me quando "${product.title}" voltar ao stock 🕯️`,
  )}`;

  return (
    <div className="buybox">
      <div className="buybox__price">
        {variant && <span className="buybox__amount">{formatMoney(variant.price)}</span>}
        {isOnSale && variant?.compareAtPrice && (
          <span className="price-old">{formatMoney(variant.compareAtPrice)}</span>
        )}
      </div>

      {!isSoldOut && (
        <div className="buybox__quantity">
          <span>Quantidade:</span>
          <div className="quantity-stepper" aria-label="Quantidade">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => setQuantity(Math.max(1, safeQuantity - 1))}
            >
              −
            </button>
            <span aria-live="polite">{safeQuantity}</span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              disabled={safeQuantity >= maxQuantity}
              onClick={() => setQuantity(Math.min(maxQuantity, safeQuantity + 1))}
            >
              +
            </button>
          </div>
        </div>
      )}

      {!isSoldOut && (
        <p className="buybox__stock">
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          {maxQuantity === 0
            ? 'Já tens no carrinho todas as unidades disponíveis'
            : t.product.inStock}
        </p>
      )}

      {variants.length > 1 && (
        <label className="buybox__variant">
          <span>Opção</span>
          <select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
            {variants.map((option) => (
              <option key={option.id} value={option.id} disabled={!option.availableForSale}>
                {option.title}
                {option.availableForSale ? '' : ` — ${t.product.soldout}`}
              </option>
            ))}
          </select>
        </label>
      )}

      <div ref={mainActionsRef} className="buybox__actions">
        {isSoldOut ? (
          <a
            className="btn btn--orange btn--block"
            href={notifyMeHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.product.notify}
            <i className="fa-solid fa-bell" aria-hidden="true" />
          </a>
        ) : (
          <>
            <button className="btn btn--orange btn--block" disabled={!canAdd} onClick={addToCart}>
              <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
              {loading ? t.product.adding : t.product.choose}
            </button>
            <button
              className="btn btn--yellow btn--block"
              disabled={isBuyingNow || loading || !variant}
              onClick={buyNow}
            >
              <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
              {isBuyingNow ? t.product.adding : t.product.buyNow}
            </button>
          </>
        )}
      </div>

      {/* Barra fixa de compra no celular: entra quando os botões acima saem do ecrã.
          Escondida, fica `inert` para não receber foco do teclado. */}
      <div className={`mobile-buy-bar${isBarVisible ? ' is-visible' : ''}`} inert={!isBarVisible}>
        {variant && <span className="mobile-buy-bar__price">{formatMoney(variant.price)}</span>}
        {isSoldOut ? (
          <a
            className="btn btn--primary mobile-buy-bar__button"
            href={notifyMeHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.product.notify} <i className="fa-solid fa-bell" aria-hidden="true" />
          </a>
        ) : (
          <button
            className="btn btn--primary mobile-buy-bar__button"
            disabled={!canAdd}
            onClick={addToCart}
          >
            {loading ? t.product.adding : t.product.choose}{' '}
            <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
