import Image from 'next/image';
import WishlistButton from './WishlistButton';
import type { Image as Img } from '@/lib/shopify/types';

// Desktop: fotos empilhadas na coluna. Mobile: carrossel com swipe (scroll-snap, sem JS).
// Cada foto mantém a proporção original (fallback 2:3, o formato das fotos da loja).
export default function ProductGallery({ images, title, handle }: { images: Img[]; title: string; handle: string }) {
  if (!images.length) {
    return (
      <div className="gallery">
        <div className="gallery__item gallery__ph" aria-hidden="true">🕯️</div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <WishlistButton handle={handle} title={title} className="gallery__wish" />
      <div className="gallery__track" role="group" aria-label="Fotos do produto">
        {images.map((img, i) => {
          const alt = img.altText ?? (i ? `${title} — foto ${i + 1}` : title);
          return (
            <div key={img.url} className="gallery__item" style={{ aspectRatio: img.width && img.height ? `${img.width} / ${img.height}` : '2 / 3' }}>
              {/* JPG original da Shopify, sem passar pelo otimizador do Next (pedido da marca: qualidade máxima).
                  format=pjpg impede o CDN da Shopify de trocar para WebP. ponytail: ~0,4–0,7 MB por foto. */}
              <Image src={`${img.url}${img.url.includes('?') ? '&' : '?'}format=pjpg`} alt={alt} title={alt} fill unoptimized style={{ objectFit: 'cover' }} priority={i === 0} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
