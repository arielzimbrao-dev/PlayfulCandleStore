import Image from 'next/image';
import Link from 'next/link';
import PagedCarousel from '@/components/PagedCarousel/PagedCarousel';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import { getProducts } from '@/lib/shopify';
import type { Review } from '@/lib/shopify/types';
import './CustomerReviews.scss';

// "Quem experimenta, apaixona-se" (home): slide de cartões (foto em cima + avaliação), com as
// avaliações aprovadas dos produtos (metafield custom.reviews, ver scripts/reviews.mjs), as mais
// recentes primeiro. Foto do cartão = a que o cliente enviou (review.photo) ou a do produto.
// Sem avaliações, a secção não aparece em produção. Em desenvolvimento mostra EXEMPLOS
// marcados como tal, só para ver o layout — avaliações inventadas não podem ir para o ar
// (publicidade enganosa; a diretiva europeia Omnibus proíbe avaliações falsas).
// ponytail: copy só em PT, como o PackBanner.
const MAX_REVIEWS = 12;

type ReviewCard = Review & { productTitle: string; productHref: string; cardPhoto: string | null; isSample?: boolean };

const sample = (photo: string, productTitle: string, productHref: string, rating: number, text: string): ReviewCard => ({
  author: 'Exemplo',
  rating,
  text,
  productTitle,
  productHref,
  cardPhoto: photo,
  isSample: true,
});

const SAMPLE_REVIEWS: ReviewCard[] = [
  sample('/images/reviews/purple-vanilla.jpg', 'Purple Vanilla', '/produtos/purple-vanilla', 5, 'Acendo ao fim do dia e o quarto fica com cheiro a baunilha quentinha. A flor de cera em cima é um mimo.'),
  sample('/images/reviews/under-the-sea.jpg', 'Under the Sea', '/produtos/under-the-sea', 5, 'Cheira mesmo a brisa do mar. O pote de cartão é tão giro que ficou na mesinha de cabeceira.'),
  sample('/images/reviews/snapbars-trio.jpg', 'Snapbars', '/categorias/snapbars', 5, 'Comprei três snapbars para experimentar e já tenho favorita: Dama da Noite. Partir um quadradinho é viciante.'),
  sample('/images/reviews/queimador-wax-melt.jpg', 'Wax Melts', '/categorias/wax-melts', 4, 'Primeira vez a usar wax melts e foi super fácil. A cera derrete devagar e o aroma dura a noite toda.'),
];

// Todas as avaliações (a média e o total contam todas); o slide mostra só as MAX_REVIEWS mais recentes.
async function getReviewCards(): Promise<ReviewCard[]> {
  const products = await getProducts(100)
    .then((page) => page.products)
    .catch(() => []);
  const cards = products.flatMap((product) =>
    product.reviews.map((review) => ({
      ...review,
      productTitle: product.title,
      productHref: `/produtos/${product.handle}`,
      cardPhoto: review.photo ?? product.featuredImage?.url ?? null,
    })),
  );
  cards.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  if (cards.length) return cards;
  return process.env.NODE_ENV === 'production' ? [] : SAMPLE_REVIEWS;
}

const STAR_VALUES = [1, 2, 3, 4, 5];

export default async function CustomerReviews() {
  const reviews = await getReviewCards();
  if (!reviews.length) return null;
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <section className="customer-reviews" aria-labelledby="customer-reviews-title">
      <div className="wrap customer-reviews__head">
        <p className="eyebrow">Avaliações de clientes</p>
        <h2 id="customer-reviews-title" className="script-title">
          <TwoToneTitle text="Quem experimenta, apaixona-se" /> <span className="script-spark" aria-hidden="true" />
        </h2>
        <p className="customer-reviews__summary">
          <i className="fa-solid fa-star" aria-hidden="true" />
          <strong>{average.toFixed(1).replace('.', ',')}</strong> de 5 · {reviews.length}{' '}
          {reviews.length === 1 ? 'avaliação' : 'avaliações'}
        </p>
      </div>

      <PagedCarousel ariaLabel="Avaliações de clientes">
        {reviews.slice(0, MAX_REVIEWS).map((review, index) => (
          <article key={index} className="review-card">
            <div className="review-card__photo">
              {review.cardPhoto && (
                <Image
                  src={review.cardPhoto}
                  alt={`${review.productTitle} em casa`}
                  fill
                  unoptimized={review.cardPhoto.startsWith('http')}
                  sizes="(max-width: 600px) 80vw, (max-width: 1024px) 45vw, 25vw"
                  style={{ objectFit: 'cover' }}
                />
              )}
              {review.isSample && <span className="review-card__sample">Exemplo · só em dev</span>}
              <span className="review-card__stars" role="img" aria-label={`${review.rating} de 5 estrelas`}>
                {STAR_VALUES.map((star) => (
                  <i key={star} className={`fa-star ${star <= review.rating ? 'fa-solid' : 'fa-regular'}`} aria-hidden="true" />
                ))}
              </span>
            </div>
            <div className="review-card__body">
              <p className="review-card__text">“{review.text}”</p>
              <footer className="review-card__footer">
                <span className="review-card__avatar" aria-hidden="true">
                  {review.author.charAt(0).toUpperCase()}
                </span>
                <span className="review-card__who">
                  <strong>{review.author}</strong>
                  {review.verified && (
                    <span className="review-card__verified">
                      <i className="fa-solid fa-circle-check" aria-hidden="true" /> Compra verificada
                    </span>
                  )}
                  <Link href={review.productHref} className="review-card__product">
                    {review.productTitle}
                  </Link>
                </span>
              </footer>
            </div>
          </article>
        ))}
      </PagedCarousel>
    </section>
  );
}
