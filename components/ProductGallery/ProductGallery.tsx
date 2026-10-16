'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import WishlistButton from '@/components/WishlistButton/WishlistButton';
import type { Image as ShopifyImage } from '@/lib/shopify/types';
import './ProductGallery.scss';

// Galeria da PDP: foto grande em slide (scroll-snap nativo → swipe no toque sem biblioteca)
// e thumbs por baixo. Setas só no desktop. No celular o slide ocupa a largura toda da tela.
// O slide manda: ao deslizar, a thumb ativa acompanha; ao clicar numa thumb, o slide rola até ela.
// Passa sozinho a cada AUTOPLAY_MS (volta à 1.ª no fim) e para com o rato por cima, o dedo
// a tocar ou o foco do teclado lá dentro. Quem pediu menos animação ao sistema não tem autoplay.
const AUTOPLAY_MS = 4000;

// JPG da Shopify, sem passar pelo otimizador do Next (pedido da marca: manter a textura).
// O CDN da Shopify redimensiona (width=) e format=pjpg impede-o de trocar para WebP.
const shopifyJpg = (url: string, width: number) =>
  `${url}${url.includes('?') ? '&' : '?'}format=pjpg&width=${width}`;
const SLIDE_WIDTHS = [640, 960, 1280, 1600];
const slideSrcSet = (url: string) => SLIDE_WIDTHS.map((w) => `${shopifyJpg(url, w)} ${w}w`).join(', ');
// Celular: a foto sangra até às bordas; tablet: .container a 90%; desktop: coluna 1,1fr da grelha
// (≈48vw, no máximo ~1030px com o --site-max-width de 1920px).
const SLIDE_SIZES = '(max-width: 760px) 100vw, (max-width: 1023px) 90vw, min(48vw, 1030px)';

export default function ProductGallery({
  images,
  title,
  handle,
}: {
  images: ShopifyImage[];
  title: string;
  handle: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeRef = useRef(0);
  activeRef.current = active;

  // Foto ativa = slide que está mais de metade visível no trilho. Observar (em vez de calcular
  // pela rolagem) aguenta mudanças de layout, como o CSS a chegar depois da hidratação.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root: track, threshold: 0.5 },
    );
    for (const slide of track.children) observer.observe(slide);
    return () => observer.disconnect();
  }, [images.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || isPaused || images.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      const next = (activeRef.current + 1) % images.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, images.length]);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  if (!images.length) {
    return (
      <div className="gallery">
        <div className="gallery__main">
          <div className="gallery__placeholder" aria-hidden="true">
            🕯️
          </div>
        </div>
      </div>
    );
  }

  const hasMany = images.length > 1;
  const altFor = (image: ShopifyImage, index: number) =>
    image.altText ?? (index ? `${title} — foto ${index + 1}` : title);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <div
      className="gallery"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div className="gallery__main">
        <div
          ref={trackRef}
          className="gallery__track"
          role="group"
          aria-roledescription="carrossel"
          aria-label="Fotos do produto"
        >
          {images.map((image, index) => (
            <div
              key={image.url}
              className="gallery__slide"
              data-index={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${images.length}`}
            >
              {/* <img> e não next/image: com unoptimized o next/image descarta o srcSet. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="gallery__photo"
                src={shopifyJpg(image.url, 1280)}
                srcSet={slideSrcSet(image.url)}
                sizes={SLIDE_SIZES}
                alt={altFor(image, index)}
                title={altFor(image, index)}
                fetchPriority={index === 0 ? 'high' : undefined}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
          ))}
        </div>

        <WishlistButton handle={handle} title={title} variant="gallery" />

        {hasMany && (
          <>
            <button
              type="button"
              className="gallery__arrow gallery__arrow--prev"
              aria-label="Foto anterior"
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="gallery__arrow gallery__arrow--next"
              aria-label="Foto seguinte"
              disabled={active === images.length - 1}
              onClick={() => goTo(active + 1)}
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
            <span className="gallery__counter" aria-hidden="true">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {hasMany && (
        <div className="gallery__thumbs">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              className={`gallery__thumb${index === active ? ' is-active' : ''}`}
              aria-label={`Ver foto ${index + 1}`}
              aria-current={index === active}
              onClick={() => goTo(index)}
            >
              <Image src={shopifyJpg(image.url, 160)} alt="" fill unoptimized style={{ objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
