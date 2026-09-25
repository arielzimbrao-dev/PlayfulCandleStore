'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Fluid section entrances: sections fade/slide in as they enter the viewport.
// Re-runs on route change (pathname dep), so it doubles as a page-transition reveal.
// Progressive enhancement: only hides content once `reveal-ready` is set by JS, and
// stays inert under prefers-reduced-motion (both here and in CSS).
//
// Driven by a passive scroll handler that RE-QUERIES the sections on every pass
// (via `data-in`, an attribute React doesn't reconcile — no hydration mismatch).
// Re-querying each time is the whole point: an IntersectionObserver captures a node
// set once, and if React swaps those nodes the observer ends up watching detached
// ghosts and content stays stuck invisible. Re-reading the live DOM can't go stale.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('reveal-ready');

    // Reveal anything whose top has reached ~92% of the viewport (a touch early,
    // so nothing below the fold flashes in as a blank gap).
    const reveal = () => {
      const els = document.querySelectorAll<HTMLElement>('main > section, [data-reveal]');
      for (const el of els) {
        if (!el.hasAttribute('data-in') && el.getBoundingClientRect().top < window.innerHeight * 0.92) {
          el.setAttribute('data-in', '');
        }
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        reveal();
      });
    };

    reveal(); // above-the-fold, immediately
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Failsafe: re-check once async content/images settle and shift layout.
    const t = window.setTimeout(reveal, 600);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
