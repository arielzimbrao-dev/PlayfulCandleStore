import Link from 'next/link';
import Image from 'next/image';
import WishlistButton from './WishlistButton';
import AddToCartMini from './AddToCartMini';
import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/shopify/types';

// productType da Shopify → rótulo do card
const TYPE_LABEL: Record<string, string> = { Vela: 'Vela de copo' };

// Card de produto: cartão branco arredondado, foto com coração (canto inf. dir.),
// tipo · nome · preço e botão "Adicionar ao carrinho" a toda a largura.
export default function ProductCardBig({
  product,
  soldoutLabel = 'Esgotado',
}: {
  product: Product;
  /** compat: rails antigos passavam um badge no 1º card — não é usado. */
  badge?: string;
  soldoutLabel?: string;
}) {
  const href = `/produtos/${product.handle}`;
  const image = product.featuredImage ?? product.images[0];
  // foto 2 aparece no hover (só dispositivos com rato — ver .bcard__alt no CSS)
  const hoverImage = product.images.find((img) => img.url !== image?.url);
  const soldOut = product.variants.length > 0 && !product.variants.some((v) => v.availableForSale);
  const sizes = '(max-width:600px) 78vw, (max-width:900px) 44vw, 22vw';

  return (
    <article className={`bcard${soldOut ? ' bcard--soldout' : ''}`} role="listitem">
      <div className="bcard__media">
        <Link href={href} className="bcard__img" aria-label={product.title} tabIndex={-1}>
          {soldOut && <span className="bcard__badge">{soldoutLabel}</span>}
          {hoverImage && (
            <Image src={hoverImage.url} alt="" fill sizes={sizes} className="bcard__alt" style={{ objectFit: 'cover' }} />
          )}
          {image ? (
            <Image src={image.url} alt={image.altText ?? product.title} fill sizes={sizes} style={{ objectFit: 'cover' }} />
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
        {product.productType && (
          <span className="bcard__type">{TYPE_LABEL[product.productType] ?? product.productType}</span>
        )}
        <Link href={href} className="bcard__name">{product.title}</Link>
        <span className="bcard__price">{formatMoney(product.priceRange.minVariantPrice)}</span>
        <AddToCartMini product={product} soldOut={soldOut} soldoutLabel={soldoutLabel} />
      </div>
    </article>
  );
}
