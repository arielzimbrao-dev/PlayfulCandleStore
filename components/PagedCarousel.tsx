'use client';

import type { ReactNode } from 'react';
import { usePagedCarousel } from './usePagedCarousel';

type Props = {
  children: ReactNode;
  ariaLabel: string;
  /** 'bleed' = left aligned to site width, right runs to the viewport edge (product rails).
   *  'wrap' = contained within the site width on both sides (e.g. reviews). */
  variant?: 'bleed' | 'wrap';
  hideDots?: boolean;
};

export default function PagedCarousel({ children, ariaLabel, variant = 'bleed', hideDots }: Props) {
  const { viewportRef, trackRef, offset, pages, active, atStart, atEnd, next, prev, toPage } =
    usePagedCarousel<HTMLDivElement, HTMLDivElement>();

  return (
    <div className={`pcar pcar--${variant}`}>
      <div className="pcar__stage">
        <div className="pcar__viewport" ref={viewportRef}>
          <div
            className="pcar__track"
            ref={trackRef}
            style={{ transform: `translateX(${offset}px)` }}
            role="list"
            aria-label={ariaLabel}
          >
            {children}
          </div>
        </div>
        <button className="car-arrow car-arrow--prev" type="button" aria-label="Anterior" disabled={atStart} onClick={prev}>
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <button className="car-arrow car-arrow--next" type="button" aria-label="Seguinte" disabled={atEnd} onClick={next}>
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
      {!hideDots && pages > 1 && (
        <div className="wrap">
          <div className="car-dots pcar__dots" aria-hidden="true">
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} type="button" className="dot" aria-current={i === active} aria-label={`Página ${i + 1}`} onClick={() => toPage(i)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
