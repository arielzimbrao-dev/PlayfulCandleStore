import Link from 'next/link';
import Image from 'next/image';
import WishlistButton from '@/components/WishlistButton/WishlistButton';
import QuickAddButton from '@/components/ProductCard/QuickAddButton/QuickAddButton';
import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/shopify/types';
import './ProductCard.scss';

// productType da Shopify → rótulo mostrado no card (os que não estão aqui aparecem como vêm).
const TYPE_LABELS: Record<string, string> = { Vela: 'Vela de copo' };

const IMAGE_SIZES = '(max-width:600px) 78vw, (max-width:900px) 44vw, 22vw';

// Card de produto: cartão branco arredondado, foto com coração (canto inferior direito),
// tipo · nome · preço e botão "Adicionar ao carrinho" na largura toda.
export default function ProductCard({ product, soldOutLabel = 'Esgotado' }: { product: Product; soldOutLabel?: string }) {
  const href = `/produtos/${product.handle}`;
  const image = product.featuredImage ?? product.images[0];
  // A 2.ª foto aparece no hover (só em dispositivos com mouse — ver ProductCard.scss).
  const hoverImage = product.images.find((other) => other.url !== image?.url);
  const isSoldOut = product.variants.length > 0 && !product.variants.some((variant) => variant.availableForSale);

  return (
    <article className={`product-card${isSoldOut ? ' product-card--sold-out' : ''}`} role="listitem">
      <div className="product-card__media">
        <Link href={href} className="product-card__image" aria-label={product.title} tabIndex={-1}>
          {isSoldOut && <span className="product-card__badge">{soldOutLabel}</span>}
          {hoverImage && (
            <Image
              src={hoverImage.url}
              alt=""
              fill
              sizes={IMAGE_SIZES}
              className="product-card__hover-image"
              style={{ objectFit: 'cover' }}
            />
          )}
          {image ? (
            <Image src={image.url} alt={image.altText ?? product.title} fill sizes={IMAGE_SIZES} style={{ objectFit: 'cover' }} />
          ) : (
            <span className="product-card__placeholder" aria-hidden="true">
              <b>{product.title}</b>
              <small>Playful Candles</small>
            </span>
          )}
        </Link>
        <WishlistButton handle={product.handle} title={product.title} variant="card" />
      </div>
      <div className="product-card__body">
        {product.productType && (
          <span className="product-card__type">{TYPE_LABELS[product.productType] ?? product.productType}</span>
        )}
        <Link href={href} className="product-card__name">
          {product.title}
        </Link>
        <span className="product-card__price">{formatMoney(product.priceRange.minVariantPrice)}</span>
        <QuickAddButton product={product} isSoldOut={isSoldOut} soldOutLabel={soldOutLabel} />
      </div>
    </article>
  );
}
