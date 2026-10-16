import Image from 'next/image';
import Link from 'next/link';
import PagedCarousel from '@/components/PagedCarousel/PagedCarousel';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import { TESTIMONIALS } from '@/lib/testimonials';
// Mesmo cabeçalho e cartões das avaliações da home (.customer-reviews / .review-card).
import '@/components/CustomerReviews/CustomerReviews.scss';
import './Testimonials.scss';

// Testemunhos reais de clientes (lista em lib/testimonials.ts). Lista vazia = secção escondida.
export default function Testimonials() {
  if (!TESTIMONIALS.length) return null;

  return (
    <section className="customer-reviews" aria-labelledby="testimonials-title">
      <div className="wrap customer-reviews__head">
        <p className="eyebrow">Testemunhos</p>
        <h2 id="testimonials-title" className="script-title">
          <TwoToneTitle text="Palavra de cliente" /> <span className="script-spark" aria-hidden="true" />
        </h2>
      </div>

      <PagedCarousel ariaLabel="Testemunhos de clientes">
        {TESTIMONIALS.map((item, index) => (
          <article key={index} className="review-card">
            {item.photo && (
              <div className="review-card__photo">
                <Image
                  src={item.photo}
                  alt={`Foto de ${item.name}`}
                  fill
                  unoptimized={item.photo.startsWith('http')}
                  sizes="(max-width: 600px) 80vw, (max-width: 1024px) 45vw, 25vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            <div className="review-card__body">
              <p className="review-card__text">“{item.text}”</p>
              <footer className="review-card__footer">
                <span className="review-card__avatar" aria-hidden="true">
                  {item.name.charAt(0).toUpperCase()}
                </span>
                <span className="review-card__who">
                  <strong>{item.name}</strong>
                  <span className="testimonial__source">
                    via {item.source}
                    {item.date ? ` · ${new Date(item.date).toLocaleDateString('pt-PT')}` : ''}
                  </span>
                  {item.productHref ? (
                    <Link href={item.productHref} className="review-card__product">
                      {item.product}
                    </Link>
                  ) : (
                    <span className="review-card__product">{item.product}</span>
                  )}
                </span>
              </footer>
            </div>
          </article>
        ))}
      </PagedCarousel>
    </section>
  );
}
