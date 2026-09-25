'use client';

import { useState } from 'react';
import Image from 'next/image';
import WishlistButton from './WishlistButton';
import type { Image as Img } from '@/lib/shopify/types';

export default function ProductGallery({ images, title, handle }: { images: Img[]; title: string; handle: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="gallery">
        <div className="gallery__main gallery__ph" aria-hidden="true">🕯️</div>
      </div>
    );
  }

  const main = images[active];
  const go = (d: number) => setActive((a) => (a + d + images.length) % images.length);

  return (
    <div className="gallery">
      <div className="gallery__main">
        <Image src={main.url} alt={main.altText ?? title} title={title} fill sizes="(max-width:900px) 100vw, 520px" quality={90} style={{ objectFit: 'cover' }} priority />
        <WishlistButton handle={handle} title={title} className="gallery__wish" />
        {images.length > 1 && (
          <>
            <button type="button" className="gallery__arrow gallery__arrow--prev" aria-label="Foto anterior" onClick={() => go(-1)}>
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button type="button" className="gallery__arrow gallery__arrow--next" aria-label="Foto seguinte" onClick={() => go(1)}>
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="gallery__thumbs" role="group" aria-label="Fotos do produto">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              aria-pressed={i === active}
              aria-label={`Ver foto ${i + 1}`}
              className={`gallery__thumb${i === active ? ' is-active' : ''}`}
              onClick={() => setActive(i)}
            >
              <Image src={img.url} alt={img.altText ?? `${title} — foto ${i + 1}`} title={title} fill sizes="80px" style={{ objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
