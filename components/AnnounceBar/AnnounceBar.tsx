'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/components/LanguageProvider';
import './AnnounceBar.scss';

const AUTOPLAY_MS = 5000;

// Barra de anúncios no topo: um aviso de cada vez, com setas.
// Avança sozinha a cada 5s e pausa enquanto o mouse ou o foco estão nela.
export default function AnnounceBar() {
  const t = useT();
  const messages = t.announce;
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const goBy = (step: number) => setCurrent((index) => (index + step + messages.length) % messages.length);

  useEffect(() => {
    if (isPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setCurrent((index) => (index + 1) % messages.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, messages.length]);

  return (
    <div
      className="announce"
      role="region"
      aria-roledescription="carousel"
      aria-label="Anúncios"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <button type="button" className="announce__arrow" aria-label={t.header.prev} onClick={() => goBy(-1)}>
        <i className="fa-solid fa-arrow-left" aria-hidden="true" />
      </button>
      <div className="announce__viewport" aria-live={isPaused ? 'polite' : 'off'}>
        <ul className="announce__track" style={{ transform: `translateX(-${current * 100}%)` }}>
          {messages.map((message, index) => (
            <li key={index} aria-hidden={index !== current}>
              {message}
            </li>
          ))}
        </ul>
      </div>
      <button type="button" className="announce__arrow" aria-label={t.header.next} onClick={() => goBy(1)}>
        <i className="fa-solid fa-arrow-right" aria-hidden="true" />
      </button>
    </div>
  );
}
