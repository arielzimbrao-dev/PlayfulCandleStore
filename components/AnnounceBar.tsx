'use client';

import { useEffect, useState } from 'react';
import { useT } from './LanguageProvider';

// Barra de anúncio no topo: slide com setas, avança sozinho a cada 5s (pausa no hover/foco).
export default function AnnounceBar() {
  const t = useT();
  const msgs = t.announce;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (d: number) => setI((n) => (n + d + msgs.length) % msgs.length);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % msgs.length), 5000);
    return () => clearInterval(id);
  }, [paused, msgs.length]);

  return (
    <div
      className="announce"
      role="region"
      aria-roledescription="carousel"
      aria-label="Anúncios"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <button type="button" className="announce__arrow" aria-label={t.header.prev} onClick={() => go(-1)}>
        <i className="fa-solid fa-arrow-left" aria-hidden="true" />
      </button>
      <div className="announce__view" aria-live={paused ? 'polite' : 'off'}>
        <ul className="announce__track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {msgs.map((m, k) => (
            <li key={k} aria-hidden={k !== i}>{m}</li>
          ))}
        </ul>
      </div>
      <button type="button" className="announce__arrow" aria-label={t.header.next} onClick={() => go(1)}>
        <i className="fa-solid fa-arrow-right" aria-hidden="true" />
      </button>
    </div>
  );
}
