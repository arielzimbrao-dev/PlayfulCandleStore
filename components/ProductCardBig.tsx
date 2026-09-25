import Link from 'next/link';
import Image from 'next/image';
import WishlistButton from './WishlistButton';
import AddToCartMini from './AddToCartMini';
import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/shopify/types';

// Card dos carrosséis (fiel ao Figma): imagem com selo de tipo (topo-esq) e coração (canto inf-dir),
// nome, preço e botão "Adicionar ao carrinho". badge fica só para o estado esgotado.
export default function ProductCardBig({
  product,
  soldoutLabel = 'Esgotado',
}: {
  product: Product;
  /** compat: rails antigos passavam um badge no 1º card — o Figma não o usa. */
  badge?: string;
  soldoutLabel?: string;
}) {
  const href = `/produtos/${product.handle}`;
  const image = product.featuredImage ?? product.images[0];
  const soldOut = product.variants.length > 0 && !product.variants.some((v) => v.availableForSale);

  return (
    <article className={`bcard${soldOut ? ' bcard--soldout' : ''}`} role="listitem">
      <div className="bcard__media">
        <Link href={href} className="bcard__img" aria-label={product.title} title={product.title}>
          {soldOut ? (
            <span className="bcard__badge bcard__badge--out">{soldoutLabel}</span>
          ) : product.productType ? (
            <span className="bcard__tag">{product.productType}</span>
          ) : null}
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.title}
              fill
              sizes="(max-width:600px) 84vw, (max-width:1000px) 50vw, 25vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <span className="bcard__ph" aria-hidden="true">
              <b>{product.title}</b>
              <small>Playful Candles</small>
            </span>
          )}
        </Link>
        <WishlistButton handle={product.handle} title={product.title} className="wish-btn--card" />
      </div>

      <div className="bcard__b">
        <Link href={href} className="bcard__name" title={product.title}>
          {product.title}
        </Link>
        <span className="bcard__price">{formatMoney(product.priceRange.minVariantPrice)}</span>
      </div>

      {!soldOut && <AddToCartMini product={product} />}
    </article>
  );
}
