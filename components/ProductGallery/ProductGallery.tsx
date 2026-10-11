import Image from 'next/image';
import WishlistButton from '@/components/WishlistButton/WishlistButton';
import type { Image as ShopifyImage } from '@/lib/shopify/types';
import './ProductGallery.scss';

// Galeria da PDP. Desktop: fotos empilhadas na coluna. Celular: carrossel com swipe (scroll-snap, sem JS).
// Cada foto mantém a proporção original (2:3 quando a Shopify não informa, o formato das fotos da loja).
export default function ProductGallery({
  images,
  title,
  handle,
}: {
  images: ShopifyImage[];
  title: string;
  handle: string;
}) {
  if (!images.length) {
    return (
      <div className="gallery">
        <div className="gallery__item gallery__placeholder" aria-hidden="true">
          🕯️
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <WishlistButton handle={handle} title={title} variant="gallery" />
      <div className="gallery__track" role="group" aria-label="Fotos do produto">
        {images.map((image, index) => {
          const alt = image.altText ?? (index ? `${title} — foto ${index + 1}` : title);
          const aspectRatio = image.width && image.height ? `${image.width} / ${image.height}` : '2 / 3';
          // JPG original da Shopify, sem passar pelo otimizador do Next (pedido da marca: qualidade máxima).
          // format=pjpg impede o CDN da Shopify de trocar para WebP. ponytail: ~0,4–0,7 MB por foto.
          const originalJpgUrl = `${image.url}${image.url.includes('?') ? '&' : '?'}format=pjpg`;
          return (
            <div key={image.url} className="gallery__item" style={{ aspectRatio }}>
              <Image
                src={originalJpgUrl}
                alt={alt}
                title={alt}
                fill
                unoptimized
                style={{ objectFit: 'cover' }}
                priority={index === 0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
