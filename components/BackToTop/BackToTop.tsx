'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import './BackToTop.scss';

const SHOW_AFTER_PX = 600;

// Botão "voltar ao topo" que aparece depois de rolar a página; também rola ao topo a cada troca de rota.
export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  // Ao mudar de rota, volta ao topo na hora (o `scroll-behavior: smooth` do html faria animar).
  // Só o pathname: filtros e ordenação mudam a query e não devem pular a página.
  // O 1.º render (carregar a página) não conta, para não estragar o "voltar" do browser e as âncoras.
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

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
