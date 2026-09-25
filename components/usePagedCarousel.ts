'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Transform-based carousel: no native scroll (so no scrollbar / drag), moved only by
// arrows + dots. offset is a negative px translateX; clamped to [-max, 0].
export function usePagedCarousel<V extends HTMLElement, T extends HTMLElement>() {
  const viewportRef = useRef<V>(null);
  const trackRef = useRef<T>(null);
  const [offset, setOffset] = useState(0);
  const [dims, setDims] = useState({ vw: 0, max: 0 });

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (!vp || !tr) return;
    const vw = vp.clientWidth;
    const max = Math.max(0, tr.scrollWidth - vw);
    setDims({ vw, max });
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

  const move = (delta: number) => setOffset((o) => Math.min(0, Math.max(-dims.max, o + delta)));
  const next = () => move(-dims.vw);
  const prev = () => move(dims.vw);
  const toPage = (i: number) => setOffset(Math.min(0, Math.max(-dims.max, -i * dims.vw)));

  const pages = dims.vw ? Math.max(1, Math.ceil((dims.max + dims.vw) / dims.vw)) : 1;
  const active = dims.vw ? Math.round(-offset / dims.vw) : 0;

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
