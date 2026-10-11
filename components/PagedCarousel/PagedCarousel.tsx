'use client';

import { useRef, type ReactNode, type TouchEvent } from 'react';
import { usePagedCarousel } from './usePagedCarousel';
import './PagedCarousel.scss';

// Deslize horizontal mínimo (px) para o toque contar como "trocar de página".
const SWIPE_MIN_DISTANCE = 40;

// Carrossel paginado dentro da largura do site: setas + bolinhas, e swipe no toque
// (no celular as setas ficam escondidas). Os itens são os `children`.
export default function PagedCarousel({ children, ariaLabel }: { children: ReactNode; ariaLabel: string }) {
  const { viewportRef, trackRef, offset, pages, activePage, atStart, atEnd, next, prev, goToPage } =
    usePagedCarousel<HTMLDivElement, HTMLDivElement>();

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (event: TouchEvent) => {
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (!touchStart.current) return;
    const deltaX = event.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    // Só conta se o gesto for mais horizontal do que vertical (senão é rolagem da página).
    const isHorizontalSwipe = Math.abs(deltaX) > SWIPE_MIN_DISTANCE && Math.abs(deltaX) > Math.abs(deltaY);
    if (isHorizontalSwipe) (deltaX < 0 ? next : prev)();
  };

  return (
    <div className="carousel">
      <div className="carousel__stage">
        <div className="carousel__viewport" ref={viewportRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div
            className="carousel__track"
            ref={trackRef}
            style={{ transform: `translateX(${offset}px)` }}
            role="list"
            aria-label={ariaLabel}
          >
            {children}
          </div>
        </div>
        <button
          className="carousel__arrow carousel__arrow--prev"
          type="button"
          aria-label="Anterior"
          disabled={atStart}
          onClick={prev}
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <button
          className="carousel__arrow carousel__arrow--next"
          type="button"
          aria-label="Seguinte"
          disabled={atEnd}
          onClick={next}
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
      {pages > 1 && (
        <div className="carousel__dots" aria-hidden="true">
          {Array.from({ length: pages }).map((_, page) => (
            <button
              key={page}
              type="button"
              className="carousel__dot"
              aria-current={page === activePage}
              aria-label={`Página ${page + 1}`}
              onClick={() => goToPage(page)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
