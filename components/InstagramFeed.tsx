'use client';

import Image from 'next/image';
import { useT } from './LanguageProvider';
import { SITE } from '@/lib/site';

const CELLS = ['ig1', 'ig2', 'ig3', 'ig4', 'ig5'];

export default function InstagramFeed() {
  const t = useT();
  return (
    <section className="sec insta" aria-labelledby="insta-h">
      <div className="wrap">
        <div className="sec__head">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo minúsculo; next/image não otimiza SVG */}
            <h2 id="insta-h" className="script-title">{t.insta.title} <img className="insta__ic" src="/icons/instagram.svg" alt="" aria-hidden="true" /></h2>
          </div>
          <a className="sec__link" href={SITE.social.instagram} target="_blank" rel="noopener noreferrer">{t.insta.link} →</a>
        </div>
      </div>
      <div className="insta__grid">
        {CELLS.map((c, i) => (
          <a
            key={c}
            className={`insta__cell insta__cell--${i}`}
            href={SITE.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.insta.title}
          >
            <Image src={`/images/instagram/${c}.jpg`} alt="" fill sizes="(max-width: 760px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
          </a>
        ))}
      </div>
    </section>
  );
}
