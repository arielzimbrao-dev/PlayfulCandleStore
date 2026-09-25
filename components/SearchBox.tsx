'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useT } from './LanguageProvider';
import { formatMoney } from '@/lib/format';
import type { SearchHit } from '@/lib/shopify/types';

export default function SearchBox() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // debounced live search
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // cancelled: um fetch já disparado de um termo anterior não pode sobrepor o resultado do termo atual.
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const data = (await res.json()) as { products: SearchHit[] };
        if (!cancelled) setResults(data.products ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q]);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/pesquisa?q=${encodeURIComponent(term)}`);
  };

  const term = q.trim();

  return (
    <div className={`search${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="hd-icon"
        aria-label={t.header.search}
        title={t.header.search}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
      </button>

      <div className="search__drop">
        <div className="wrap">
          <form className="search__form" onSubmit={submit} role="search">
            <i className="fa-solid fa-magnifying-glass search__icon" aria-hidden="true" />
            <input
              ref={inputRef}
              className="search__input"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search.placeholder}
              aria-label={t.search.label}
            />
            <button type="submit" className="btn btn--primary search__submit">{t.search.button}</button>
          </form>

          {term && (
            <div className="search__results">
              {results.length > 0 ? (
                <ul>
                  {results.map((p) => (
                    <li key={p.id}>
                      <Link href={`/produtos/${p.handle}`} className="search__item" onClick={() => setOpen(false)}>
                        <span className="search__thumb">
                          {p.featuredImage ? (
                            <Image src={p.featuredImage.url} alt={p.featuredImage.altText ?? p.title} title={p.title} width={48} height={48} style={{ objectFit: 'cover' }} />
                          ) : (
                            <span aria-hidden="true">🕯️</span>
                          )}
                        </span>
                        <span className="search__name">{p.title}</span>
                        <span className="search__price">{formatMoney(p.priceRange.minVariantPrice)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="search__msg">{loading ? '…' : `${t.search.noResults} “${term}”`}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
