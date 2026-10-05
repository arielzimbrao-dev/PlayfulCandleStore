'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Transform-based carousel: no native scroll (so no scrollbar / drag), moved only by
// arrows + dots. offset is a negative px translateX; clamped to [-max, 0].
export function usePagedCarousel<V extends HTMLElement, T extends HTMLElement>() {
  const viewportRef = useRef<V>(null);
  const trackRef = useRef<T>(null);
  const [offset, setOffset] = useState(0);
  const [dims, setDims] = useState({ step: 0, max: 0 });

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (!vp || !tr) return;
    const vw = vp.clientWidth;
    const max = Math.max(0, tr.scrollWidth - vw);
    // Passo = nº de itens inteiros visíveis × (largura + gap) — mantém o alinhamento com "peek".
    const first = tr.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(tr).columnGap) || 0;
    const item = first ? first.offsetWidth + gap : vw;
    const step = Math.max(1, Math.floor((vw + gap) / item)) * item;
    setDims({ step, max });
    setOffset((o) => Math.min(0, Math.max(-max, o)));
  }, []);

  useEffect(() => {
    measure();
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Encaixa sempre em múltiplos do passo (o último fica alinhado à direita, -max).
  const toPage = (i: number) => setOffset(Math.min(0, Math.max(-dims.max, -i * dims.step)));
  const next = () => dims.step && setOffset((o) => Math.max(-dims.max, -(Math.floor(-o / dims.step + 0.01) + 1) * dims.step));
  const prev = () => dims.step && setOffset((o) => Math.min(0, -(Math.ceil(-o / dims.step - 0.01) - 1) * dims.step));

  const pages = dims.step ? Math.max(1, Math.ceil(dims.max / dims.step - 0.01) + 1) : 1;
  const active = dims.step ? Math.min(pages - 1, Math.ceil(-offset / dims.step - 0.01)) : 0;

  return {
    viewportRef,
    trackRef,
    offset,
    pages,
    active,
    atStart: offset >= -1,
    atEnd: offset <= -dims.max + 1,
    next,
    prev,
    toPage,
  };
}
