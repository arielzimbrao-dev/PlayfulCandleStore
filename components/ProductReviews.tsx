'use client';

import { useState, type FormEvent } from 'react';
import { useToast } from './Toast';
import type { Review } from '@/lib/shopify/types';

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={`fa-${i <= rounded ? 'solid' : 'regular'} fa-star`} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function ProductReviews({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ author: '', rating: 5, text: '', website: '' });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.author.trim() || !form.text.trim()) {
      toast.show('Preenche o nome e o comentário.', 'error');
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
      setForm({ author: '', rating: 5, text: '', website: '' });
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
        <div className="reviews-pdp__head">
          <div>
            <h2 id="rev-h" className="script-title">Avaliações <span className="script-spark" aria-hidden="true">✦</span></h2>
            {reviews.length > 0 ? (
              <p className="reviews-pdp__avg">
                <Stars value={avg} /> <strong>{avg.toFixed(1)}</strong> · {reviews.length}{' '}
                {reviews.length === 1 ? 'avaliação' : 'avaliações'}
              </p>
            ) : (
              <p className="reviews-pdp__avg">Ainda sem avaliações. Sê o primeiro a deixar a tua. ✨</p>
            )}
          </div>
          <button type="button" className="btn btn--outline" onClick={() => setOpen((o) => !o)}>
            {open ? 'Cancelar' : 'Escrever avaliação'}
          </button>
        </div>

        {open && (
          <form className="reviews-form" onSubmit={submit}>
            <label className="reviews-form__row">
              <span>Nome</span>
              <input value={form.author} maxLength={60} onChange={(e) => setForm({ ...form, author: e.target.value })} required />
            </label>
            <label className="reviews-form__row">
              <span>Classificação</span>
              <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} estrela{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </label>
            <label className="reviews-form__row">
              <span>Comentário</span>
              <textarea value={form.text} maxLength={1000} rows={4} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
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
            <button type="submit" className="btn btn--primary" disabled={sending}>
              {sending ? 'A enviar…' : 'Enviar avaliação'}
            </button>
          </form>
        )}

        {reviews.length > 0 && (
          <ul className="reviews-list">
            {reviews.map((r, i) => (
              <li key={i} className="review">
                <div className="review__top">
                  <Stars value={r.rating} />
                  {r.verified && <span className="review__v">✓ Compra verificada</span>}
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
