'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './ScrollReveal.scss';

// Fração da altura da tela em que a seção começa a aparecer (um pouco antes de entrar,
// para nada abaixo da dobra surgir como um buraco em branco).
const REVEAL_THRESHOLD = 0.92;

// Entrada suave das seções conforme entram na tela. Roda de novo a cada troca de rota
// (dependência do pathname), então também funciona como transição de página.
//
// Melhoria progressiva: o conteúdo só fica escondido depois que o JS adiciona `reveal-ready`
// no <html>, e nada acontece com prefers-reduced-motion (aqui e no CSS).
//
// Por que um listener de scroll que consulta o DOM a cada passada, e não um IntersectionObserver?
// O observer guarda os nós uma vez; se o React trocar esses nós, ele fica observando elementos
// soltos e o conteúdo fica invisível para sempre. Reler o DOM vivo nunca fica desatualizado.
// O atributo `data-in` não é controlado pelo React, então não causa erro de hidratação.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('reveal-ready');

    const revealVisibleSections = () => {
      const elements = document.querySelectorAll<HTMLElement>('main > section, [data-reveal]');
      for (const element of elements) {
        const isNearViewport = element.getBoundingClientRect().top < window.innerHeight * REVEAL_THRESHOLD;
        if (!element.hasAttribute('data-in') && isNearViewport) element.setAttribute('data-in', '');
      }
    };

    // No máximo uma verificação por frame.
    let isFrameQueued = false;
    const onScrollOrResize = () => {
      if (isFrameQueued) return;
      isFrameQueued = true;
      requestAnimationFrame(() => {
        isFrameQueued = false;
        revealVisibleSections();
      });
    };

    revealVisibleSections(); // o que já está visível ao carregar
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    // Segurança: verifica de novo quando imagens/conteúdo assíncrono mudam o layout.
    const settleTimer = window.setTimeout(revealVisibleSections, 600);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      clearTimeout(settleTimer);
    };
  }, [pathname]);

  return null;
}
