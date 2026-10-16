import { SITE } from '@/lib/site';
import './GoogleRating.scss';

// Selo "★ 5,0 no Google · 2 avaliações" com link para a ficha Google da loja.
// Valores em SITE.googleReviews (lib/site.ts).
export default function GoogleRating() {
  const { rating, count } = SITE.googleReviews;
  return (
    <a className="google-rating" href={SITE.social.google} target="_blank" rel="noopener noreferrer">
      <i className="fa-solid fa-star" aria-hidden="true" />
      <strong>{rating.toFixed(1).replace('.', ',')}</strong> no Google · {count} {count === 1 ? 'avaliação' : 'avaliações'}
    </a>
  );
}
