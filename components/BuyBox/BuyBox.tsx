'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/cart-context';
import { useToast } from '@/components/Toast/Toast';
import { useT } from '@/components/LanguageProvider';
import { formatMoney, savingsLabel } from '@/lib/format';
import ShippingNote from '@/components/ShippingNote/ShippingNote';
import { ecommerceEvent } from '@/lib/analytics';
import { SITE } from '@/lib/site';
import PackPicker, { type PackPickerSlot } from '@/components/PackPicker/PackPicker';
import type { Product } from '@/lib/shopify/types';
import './BuyBox.scss';

// Quantidade máxima quando a Shopify não informa o estoque.
const UNLIMITED_STOCK = 99;

// Caixa de compra da PDP: preço, quantidade, variante e os botões
// "Adicionar ao carrinho" + "Comprar agora". No celular há também uma barra fixa no rodapé.
// pack: itens a escolher num pack — a escolha vai como propriedades da linha do carrinho.
// shippingFrom: portes desde (€) para a linha sob os botões (C3).
export default function BuyBox({
  product,
  pack,
  shippingFrom,
}: {
  product: Product;
  pack?: PackPickerSlot[];
  shippingFrom?: number;
}) {
  const { cart, addItem, loading } = useCart();
  const toast = useToast();
  const t = useT();
  const variants = product.variants;
  const firstAvailable = variants.find((variant) => variant.availableForSale) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [packChoice, setPackChoice] = useState<Record<string, string>>({}); // item → handle
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

  // Voltar do checkout pelo "Voltar" do browser restaura a página do bfcache ainda em
  // "A adicionar…" — destrava o "Comprar agora".
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setIsBuyingNow(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  if (variants.length === 0) return <p>Produto indisponível.</p>;

  const variant = variants.find((candidate) => candidate.id === variantId) ?? firstAvailable;
  // Limite = estoque menos o que já está no carrinho (quantityAvailable null = sem limite).
  const quantityInCart =
    cart?.lines.find((line) => line.merchandise.id === variant?.id)?.quantity ?? 0;
  // Pack: a escolha (item → nome) e quantos packs o stock dos itens escolhidos permite.
  // ponytail: não desconta os mesmos itens já no carrinho (soltos ou noutro pack) — o /api/cart
  // conta o carrinho todo e recusa; aqui o cliente só vê o erro ao adicionar.
  const packAttributes = pack?.flatMap((slot) => {
    const option = slot.options.find((candidate) => candidate.handle === packChoice[slot.key]);
    return option ? [{ key: slot.key, value: option.title }] : [];
  });
  const isPackIncomplete = !!pack && packAttributes!.length < pack.length;
  const packMax = Math.min(
    ...(pack ?? []).flatMap((slot) => {
      const option = slot.options.find((candidate) => candidate.handle === packChoice[slot.key]);
      const uses = Object.values(packChoice).filter((handle) => handle === option?.handle).length;
      return option?.stock != null ? [Math.floor(option.stock / uses)] : [];
    }),
  );
  const maxQuantity = Math.min(
    packMax,
    variant?.quantityAvailable == null ? UNLIMITED_STOCK : Math.max(0, variant.quantityAvailable - quantityInCart),
  );
  const isSoldOut =
    !variant?.availableForSale ||
    variant.quantityAvailable === 0 ||
    (!!pack && pack.some((slot) => slot.options.length === 0));
  const safeQuantity = Math.min(quantity, Math.max(1, maxQuantity));
  const isOnSale =
    !!variant?.compareAtPrice &&
    Number(variant.compareAtPrice.amount) > Number(variant.price.amount);
  const canAdd = !loading && !isBuyingNow && !!variant && maxQuantity > 0 && !isPackIncomplete;
  const addLabel = isPackIncomplete ? 'Escolhe os itens do pack' : loading ? t.product.adding : t.product.choose;

  const trackAddToCart = (event: 'add_to_cart' | 'begin_checkout' = 'add_to_cart') => {
    if (!variant) return;
    ecommerceEvent(
      event,
      [
        {
          item_id: product.id,
          item_name: product.title,
          price: Number(variant.price.amount),
          quantity: safeQuantity,
          item_category: product.productType,
        },
      ],
      { value: Number(variant.price.amount) * safeQuantity, currency: variant.price.currencyCode },
    );
  };

  const addToCart = async () => {
    if (!variant) return;
    const { ok, error } = await addItem(variant.id, safeQuantity, packAttributes);
    toast.show(ok ? `${product.title} — ${t.product.added}` : (error ?? t.product.addError), ok ? 'success' : 'error');
    if (ok) trackAddToCart();
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
          quantity: safeQuantity,
          attributes: packAttributes,
          buyNow: true,
        }),
      });
      const data = (await response.json()) as { cart?: { checkoutUrl?: string } };
      if (data.cart?.checkoutUrl) {
        trackAddToCart();
        trackAddToCart('begin_checkout');
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
  const notifyMeHref = `${SITE.notifyWhatsapp}?text=${encodeURIComponent(
    `Olá! Avisem-me quando "${product.title}" voltar ao stock 🕯️`,
  )}`;

  return (
    <div className="buybox">
      <div className="buybox__price">
        {variant && <span className="buybox__amount">{formatMoney(variant.price)}</span>}
        {isOnSale && variant?.compareAtPrice && (
          <span className="price-old">{formatMoney(variant.compareAtPrice)}</span>
        )}
        {product.packSavings && <span className="price-savings">{savingsLabel(product.packSavings)}</span>}
      </div>

      {pack && !isSoldOut && (
        <PackPicker
          slots={pack}
          value={packChoice}
          onChange={(key, handle) => setPackChoice((current) => ({ ...current, [key]: handle }))}
        />
      )}

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
              {addLabel}
            </button>
            <button
              className="btn btn--yellow btn--block"
              disabled={!canAdd}
              onClick={buyNow}
            >
              <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
              {isBuyingNow ? t.product.adding : t.product.buyNow}
            </button>
          </>
        )}
      </div>
      {!isSoldOut && <ShippingNote from={shippingFrom} />}

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
            {addLabel}{' '}
            <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
