'use client';

import { useId, useState, type FormEvent } from 'react';
import { useToast } from './Toast';
import type { Review } from '@/lib/shopify/types';

const LABELS = ['', 'Fraco', 'Razoável', 'Bom', 'Muito bom', 'Excelente'];

function Stars({ value, size }: { value: number; size?: 'lg' }) {
  const rounded = Math.round(value);
  return (
    <span className={`stars${size ? ` stars--${size}` : ''}`} role="img" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={`fa-star ${i <= rounded ? 'fa-solid' : 'fa-regular'}`} aria-hidden="true" />
      ))}
    </span>
  );
}

// Seletor de estrelas: rádios nativos (setas do teclado funcionam) com estrelas como label;
// hover pré-visualiza, a legenda diz o que cada nota significa.
function StarPicker({ value, onChange, invalid }: { value: number; onChange: (n: number) => void; invalid: boolean }) {
  const [hover, setHover] = useState(0);
  const name = useId();
  const shown = hover || value;
  return (
    <fieldset className={`star-pick${invalid ? ' is-invalid' : ''}`} aria-describedby={`${name}-hint`}>
      <legend>A tua classificação</legend>
      <div className="star-pick__row" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`star-pick__star${n <= shown ? ' is-on' : ''}`} onMouseEnter={() => setHover(n)}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
            <i className={`fa-star ${n <= shown ? 'fa-solid' : 'fa-regular'}`} aria-hidden="true" />
            <span className="visually-hidden">{n} {n > 1 ? 'estrelas' : 'estrela'} — {LABELS[n]}</span>
          </label>
        ))}
        <span className="star-pick__label" id={`${name}-hint`} aria-live="polite">
          {shown ? LABELS[shown] : invalid ? 'Escolhe de 1 a 5 estrelas' : 'Toca nas estrelas'}
        </span>
      </div>
    </fieldset>
  );
}

const EMPTY = { author: '', rating: 0, text: '', website: '' };

export default function ProductReviews({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [tried, setTried] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!form.rating || !form.author.trim() || !form.text.trim()) {
      toast.show(!form.rating ? 'Escolhe a tua classificação em estrelas.' : 'Preenche o nome e o comentário.', 'error');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...form }),
      });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error);
      }
      toast.show('Obrigado! A tua avaliação foi enviada e será publicada após revisão.', 'success');
      setForm(EMPTY);
      setTried(false);
      setOpen(false);
    } catch (e) {
      toast.show(e instanceof Error && e.message ? e.message : 'Não foi possível enviar a avaliação.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="sec reviews-pdp" aria-labelledby="rev-h">
      <div className="wrap">
        <h2 id="rev-h" className="script-title">Reviews <span className="script-spark" aria-hidden="true" /></h2>

        <div className="rv-sum">
          {reviews.length > 0 ? (
            <div className="rv-sum__score">
              <strong className="rv-sum__avg">{avg.toFixed(1)}</strong>
              <div>
                <Stars value={avg} size="lg" />
                <p className="rv-sum__count">
                  {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>
            </div>
          ) : (
            <div className="rv-sum__empty">
              <Stars value={0} size="lg" />
              <p>Ainda sem avaliações. Sê o primeiro a dizer o que achaste! ✨</p>
            </div>
          )}
          {reviews.length > 0 && (
            <ul className="rv-dist" aria-label="Distribuição das avaliações">
              {dist.map(({ n, c }) => (
                <li key={n}>
                  <span>{n} <i className="fa-solid fa-star" aria-hidden="true" /></span>
                  <span className="rv-dist__bar"><span style={{ width: `${(c / reviews.length) * 100}%` }} /></span>
                  <span className="rv-dist__c">{c}</span>
                </li>
              ))}
            </ul>
          )}
          {!open && (
            <button type="button" className="btn btn--primary rv-sum__cta" onClick={() => setOpen(true)}>
              <i className="fa-regular fa-pen-to-square" aria-hidden="true" /> Escrever avaliação
            </button>
          )}
        </div>

        {open && (
          <form className="reviews-form" onSubmit={submit} noValidate>
            <StarPicker value={form.rating} onChange={(rating) => setForm({ ...form, rating })} invalid={tried && !form.rating} />
            <label className="reviews-form__row">
              <span>Nome</span>
              <input
                value={form.author}
                maxLength={60}
                autoComplete="given-name"
                placeholder="Como queres aparecer"
                aria-invalid={tried && !form.author.trim()}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </label>
            <label className="reviews-form__row">
              <span>Comentário</span>
              <textarea
                value={form.text}
                maxLength={1000}
                rows={4}
                placeholder="O aroma, a duração, o que mais gostaste…"
                aria-invalid={tried && !form.text.trim()}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
              />
              <small className="reviews-form__count">{form.text.length}/1000</small>
            </label>
            {/* honeypot — escondido para humanos, irresistível para bots */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            />
            <p className="reviews-form__note">A tua avaliação é publicada depois de revista pela nossa equipa.</p>
            <div className="reviews-form__actions">
              <button type="button" className="btn btn--outline" onClick={() => { setOpen(false); setTried(false); }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary" disabled={sending}>
                {sending ? 'A enviar…' : 'Enviar avaliação'}
              </button>
            </div>
          </form>
        )}

        {reviews.length > 0 && (
          <ul className="reviews-list">
            {reviews.map((r, i) => (
              <li key={i} className="review">
                <div className="review__top">
                  <Stars value={r.rating} />
                  {r.verified && <span className="review__v"><i className="fa-solid fa-circle-check" aria-hidden="true" /> Compra verificada</span>}
                </div>
                {r.text && <p className="review__text">{r.text}</p>}
                <p className="review__who">
                  {r.author}
                  {r.date ? ` · ${new Date(r.date).toLocaleDateString('pt-PT')}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
