'use client';

import Image from 'next/image';
import { useT } from './LanguageProvider';

export default function BrandStory() {
  const t = useT();
  return (
    <section className="sec story" aria-labelledby="story-h">
      <div className="wrap story__grid">
        <div className="story__logo">
          <span className="brand-logo">
            <Image src="/images/logo.png" alt="Playful Candles" width={1615} height={341} sizes="260px" />
          </span>
        </div>

        <div className="story__mid">
          <h2 id="story-h">{t.story.title}</h2>
          <p className="story__text">{t.story.text}</p>
        </div>

        <ul className="story__feats">
          {t.story.features.map((f) => (
            <li key={f.title}>
              <span className="story__feat-ic"><i className={`fa-solid ${f.icon}`} aria-hidden="true" /></span>
              <span className="story__feat-t"><b>{f.title}</b>{f.sub && <small>{f.sub}</small>}</span>
            </li>
          ))}
        </ul>

        <div className="story__art">
          <Image src="/images/instagram/ig3.jpg" alt={t.story.alt} fill sizes="(max-width: 900px) 90vw, 30vw" style={{ objectFit: 'cover' }} />
          <span className="story__bubble">{t.story.bubble}</span>
        </div>
      </div>
    </section>
  );
}
