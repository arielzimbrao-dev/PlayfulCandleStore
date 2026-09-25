'use client';

import Image from 'next/image';
import { useT } from './LanguageProvider';

// Static testimonials (sample content). Photos reuse the brand's Instagram shots.
// ponytail: sample reviews until a real reviews source is wired.
const REVIEWS = [
  { img: '/images/instagram/ig2.jpg', rating: 5, text: 'A minha casa cheira INCRÍVEL e a vela dura imenso. Já vou na terceira encomenda.', who: 'Sofia M.', verified: true },
  { img: '/images/instagram/ig3.jpg', rating: 5, text: 'Comprei para oferecer e o embrulho é lindo. A pessoa adorou o aroma de maracujá.', who: 'Rui P.', verified: true },
  { img: '/images/instagram/ig4.jpg', rating: 5, text: 'Os snapbars são viciantes. Faço sempre o pack de 5 e mudo o mood conforme o dia.', who: 'Beatriz L.', verified: true },
];

export default function Reviews() {
  const t = useT();
  return (
    <section className="sec" aria-labelledby="rev-h">
      <div className="wrap">
        <div className="sec__head">
          <div>
            <h2 id="rev-h">{t.reviews.title}</h2>
          </div>
        </div>
        <div className="rev__grid">
          {REVIEWS.map((r, idx) => (
            <figure className="rev" key={idx}>
              <div className="rev__stars" role="img" aria-label={`${r.rating} / 5`}>
                {Array.from({ length: r.rating }).map((_, i) => (
                  <span key={i} aria-hidden="true">★</span>
                ))}
              </div>
              <blockquote style={{ margin: '.6rem 0 0' }}>{r.text}</blockquote>
              <figcaption className="rev__who">
                <span className="rev__ava">
                  <Image src={r.img} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />
                </span>
                <div>
                  <div className="rev__name">{r.who}</div>
                  {r.verified && <div className="rev__v">✓ {t.reviews.verified}</div>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
