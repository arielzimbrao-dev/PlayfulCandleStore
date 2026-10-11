'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Tolerância para arredondamentos de pixel ao calcular a página atual.
const EPSILON = 0.01;

// Lógica do carrossel por transform (sem rolagem nativa → sem barra nem arrasto),
// movido só pelas setas, bolinhas e swipe.
// `offset` é o translateX em px (negativo), sempre entre -maxOffset e 0.
export function usePagedCarousel<Viewport extends HTMLElement, Track extends HTMLElement>() {
  const viewportRef = useRef<Viewport>(null);
  const trackRef = useRef<Track>(null);
  const [offset, setOffset] = useState(0);
  const [layout, setLayout] = useState({ pageWidth: 0, maxOffset: 0 });

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const viewportWidth = viewport.clientWidth;
    const maxOffset = Math.max(0, track.scrollWidth - viewportWidth);
    // Uma "página" = nº de itens inteiros visíveis × (largura do item + gap).
    // Assim o carrossel anda sempre alinhado ao início de um item.
    const firstItem = track.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const itemWidth = firstItem ? firstItem.offsetWidth + gap : viewportWidth;
    const pageWidth = Math.max(1, Math.floor((viewportWidth + gap) / itemWidth)) * itemWidth;
    setLayout({ pageWidth, maxOffset });
    setOffset((current) => Math.min(0, Math.max(-maxOffset, current)));
  }, []);

  // Mede de novo sempre que a tela ou a lista mudam de tamanho.
  useEffect(() => {
    measure();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    if (trackRef.current) observer.observe(trackRef.current);
    return () => observer.disconnect();
  }, [measure]);

  const { pageWidth, maxOffset } = layout;
  const clamp = (value: number) => Math.min(0, Math.max(-maxOffset, value));

  // Sempre encaixa em múltiplos da página (a última fica alinhada à direita, em -maxOffset).
  const goToPage = (page: number) => setOffset(clamp(-page * pageWidth));
  const next = () =>
    pageWidth && setOffset((current) => clamp(-(Math.floor(-current / pageWidth + EPSILON) + 1) * pageWidth));
  const prev = () =>
    pageWidth && setOffset((current) => clamp(-(Math.ceil(-current / pageWidth - EPSILON) - 1) * pageWidth));

  const pages = pageWidth ? Math.max(1, Math.ceil(maxOffset / pageWidth - EPSILON) + 1) : 1;
  const activePage = pageWidth ? Math.min(pages - 1, Math.ceil(-offset / pageWidth - EPSILON)) : 0;

  return {
    viewportRef,
    trackRef,
    offset,
    pages,
    activePage,
    atStart: offset >= -1,
    atEnd: offset <= -maxOffset + 1,
    next,
    prev,
    goToPage,
  };
}
