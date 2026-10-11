'use client';

import { useEffect, useState } from 'react';
import './BackToTop.scss';

const SHOW_AFTER_PX = 600;

// Botão "voltar ao topo" que aparece depois de rolar a página.
export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`back-to-top${isVisible ? ' is-visible' : ''}`}
      aria-label="Voltar ao topo"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <i className="fa-solid fa-arrow-up" aria-hidden="true" />
    </button>
  );
}
