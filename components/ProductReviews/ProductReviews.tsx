'use client';

import { useId, useState, type FormEvent } from 'react';
import { useToast } from '@/components/Toast/Toast';
import type { Review } from '@/lib/shopify/types';
import GoogleRating from '@/components/GoogleRating/GoogleRating';
import './ProductReviews.scss';

// Significado de cada nota (índice = número de estrelas).
const RATING_LABELS = ['', 'Fraco', 'Razoável', 'Bom', 'Muito bom', 'Excelente'];
const STAR_VALUES = [1, 2, 3, 4, 5];
const MAX_COMMENT_LENGTH = 1000;

function Stars({ value, large = false }: { value: number; large?: boolean }) {
  const filledStars = Math.round(value);
  return (
    <span className={`stars${large ? ' stars--large' : ''}`} role="img" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {STAR_VALUES.map((star) => (
        <i key={star} className={`fa-star ${star <= filledStars ? 'fa-solid' : 'fa-regular'}`} aria-hidden="true" />
      ))}
    </span>
  );
}

// Seletor de estrelas: rádios nativos (as setas do teclado funcionam) com estrelas como label.
// Passar o mouse pré-visualiza a nota; a legenda diz o que cada nota significa.
function StarPicker({ value, onChange, isInvalid }: { value: number; onChange: (rating: number) => void; isInvalid: boolean }) {
  const [hovered, setHovered] = useState(0);
  const groupName = useId();
  const shownRating = hovered || value;
  return (
    <fieldset className={`star-picker${isInvalid ? ' is-invalid' : ''}`} aria-describedby={`${groupName}-hint`}>
      <legend>A tua classificação</legend>
      <div className="star-picker__row" onMouseLeave={() => setHovered(0)}>
        {STAR_VALUES.map((star) => (
          <label
            key={star}
            className={`star-picker__star${star <= shownRating ? ' is-on' : ''}`}
            onMouseEnter={() => setHovered(star)}
          >
            <input type="radio" name={groupName} value={star} checked={value === star} onChange={() => onChange(star)} />
            <i className={`fa-star ${star <= shownRating ? 'fa-solid' : 'fa-regular'}`} aria-hidden="true" />
            <span className="visually-hidden">
              {star} {star > 1 ? 'estrelas' : 'estrela'} — {RATING_LABELS[star]}
            </span>
          </label>
        ))}
        <span className="star-picker__label" id={`${groupName}-hint`} aria-live="polite">
          {shownRating ? RATING_LABELS[shownRating] : isInvalid ? 'Escolhe de 1 a 5 estrelas' : 'Toca nas estrelas'}
        </span>
      </div>
    </fieldset>
  );
}

// `website` é um honeypot: campo invisível que só bots preenchem (a API descarta esses envios).
const EMPTY_FORM = { author: '', rating: 0, text: '', website: '' };

// Avaliações da PDP: resumo (média + distribuição), formulário e lista.
// As avaliações novas só aparecem depois de aprovadas pela equipe.
export default function ProductReviews({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const toast = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [triedToSubmit, setTriedToSubmit] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));

  const closeForm = () => {
    setIsFormOpen(false);
    setTriedToSubmit(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTriedToSubmit(true);
    if (!form.rating || !form.author.trim() || !form.text.trim()) {
      toast.show(!form.rating ? 'Escolhe a tua classificação em estrelas.' : 'Preenche o nome e o comentário.', 'error');
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...form }),
      });
      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(error);
      }
      toast.show('Obrigado! A tua avaliação foi enviada e será publicada após revisão.', 'success');
      setForm(EMPTY_FORM);
      closeForm();
    } catch (error) {
      toast.show(error instanceof Error && error.message ? error.message : 'Não foi possível enviar a avaliação.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="section" aria-labelledby="reviews-title">
      <div className="wrap">
        <h2 id="reviews-title" className="script-title">
          Reviews <span className="script-spark" aria-hidden="true" />
        </h2>

        <div className="reviews-summary">
          {reviews.length > 0 ? (
            <div className="reviews-summary__score">
              <strong className="reviews-summary__average">{average.toFixed(1)}</strong>
              <div>
                <Stars value={average} large />
                <p className="reviews-summary__count">
                  {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>
            </div>
          ) : (
            // Sem avaliações: nada de estrelas vazias — o selo Google da loja e um convite discreto.
            <div className="reviews-summary__empty">
              <GoogleRating />
              <p>Já provaste este aroma? Conta-nos o que achaste ✨</p>
            </div>
          )}
          {reviews.length > 0 && (
            <ul className="reviews-distribution" aria-label="Distribuição das avaliações">
              {distribution.map(({ stars, count }) => (
                <li key={stars}>
                  <span>
                    {stars} <i className="fa-solid fa-star" aria-hidden="true" />
                  </span>
                  <span className="reviews-distribution__bar">
                    <span style={{ width: `${(count / reviews.length) * 100}%` }} />
                  </span>
                  <span className="reviews-distribution__count">{count}</span>
                </li>
              ))}
            </ul>
          )}
          {!isFormOpen && (
            <button type="button" className="btn btn--primary reviews-summary__cta" onClick={() => setIsFormOpen(true)}>
              <i className="fa-regular fa-pen-to-square" aria-hidden="true" /> Escrever avaliação
            </button>
          )}
        </div>

        {isFormOpen && (
          <form className="review-form" onSubmit={submit} noValidate>
            <StarPicker
              value={form.rating}
              onChange={(rating) => setForm({ ...form, rating })}
              isInvalid={triedToSubmit && !form.rating}
            />
            <label className="review-form__field">
              <span>Nome</span>
              <input
                value={form.author}
                maxLength={60}
                autoComplete="given-name"
                placeholder="Como queres aparecer"
                aria-invalid={triedToSubmit && !form.author.trim()}
                onChange={(event) => setForm({ ...form, author: event.target.value })}
              />
            </label>
            <label className="review-form__field">
              <span>Comentário</span>
              <textarea
                value={form.text}
                maxLength={MAX_COMMENT_LENGTH}
                rows={4}
                placeholder="O aroma, a duração, o que mais gostaste…"
                aria-invalid={triedToSubmit && !form.text.trim()}
                onChange={(event) => setForm({ ...form, text: event.target.value })}
              />
              <small className="review-form__counter">
                {form.text.length}/{MAX_COMMENT_LENGTH}
              </small>
            </label>
            <input
              type="text"
              name="website"
              className="review-form__honeypot"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
            />
            <p className="review-form__note">A tua avaliação é publicada depois de revista pela nossa equipa.</p>
            <div className="review-form__actions">
              <button type="button" className="btn btn--outline" onClick={closeForm}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary" disabled={isSending}>
                {isSending ? 'A enviar…' : 'Enviar avaliação'}
              </button>
            </div>
          </form>
        )}

        {reviews.length > 0 && (
          <ul className="reviews-list">
            {reviews.map((review, index) => (
              <li key={index} className="review">
                <div className="review__top">
                  <Stars value={review.rating} />
                  {review.verified && (
                    <span className="review__verified">
                      <i className="fa-solid fa-circle-check" aria-hidden="true" /> Compra verificada
                    </span>
                  )}
                </div>
                {review.text && <p className="review__text">{review.text}</p>}
                <p className="review__author">
                  {review.author}
                  {review.date ? ` · ${new Date(review.date).toLocaleDateString('pt-PT')}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
