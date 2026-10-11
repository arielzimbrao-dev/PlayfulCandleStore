'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/components/LanguageProvider';
import { useDismiss } from '@/components/useDismiss';
import { formatMoney } from '@/lib/format';
import type { SearchHit } from '@/lib/shopify/types';
import './SearchBox.scss';

const SEARCH_DELAY_MS = 300; // espera o usuário parar de digitar antes de buscar

// Pesquisa do header com resultados ao vivo. Enter leva à página /pesquisa.
// Desktop: a barra fica sempre visível. Telas menores: a lupa abre a barra por baixo do header.
export default function SearchBox() {
  const t = useT();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(rootRef, isOpen, close);

  const term = query.trim();

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Busca ao vivo com atraso (debounce).
  useEffect(() => {
    if (!term) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // Uma resposta atrasada de um termo anterior não pode sobrescrever a do termo atual.
    let isStale = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const data = (await response.json()) as { products: SearchHit[] };
        if (!isStale) setResults(data.products ?? []);
      } catch {
        if (!isStale) setResults([]);
      } finally {
        if (!isStale) setIsLoading(false);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      isStale = true;
      clearTimeout(timer);
    };
  }, [term]);

  const goToResultsPage = (event?: FormEvent) => {
    event?.preventDefault();
    if (!term) return;
    setIsOpen(false);
    router.push(`/pesquisa?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className={`search${isOpen ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="header__icon-button"
        aria-label={t.header.search}
        title={t.header.search}
        aria-expanded={isOpen}
        // Com texto digitado a lupa pesquisa; sem texto, abre/fecha a barra (telas menores).
        onClick={() => (isOpen && term ? goToResultsPage() : setIsOpen((open) => !open))}
      >
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
      </button>

      <form className="search__form" onSubmit={goToResultsPage} role="search">
        <input
          ref={inputRef}
          className="search__input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search.placeholder}
          aria-label={t.search.label}
          onFocus={() => setIsOpen(true)}
        />
      </form>

      {isOpen && term && (
        <div className="search__results">
          {results.length > 0 ? (
            <ul>
              {results.map((product) => (
                <li key={product.id}>
                  <Link href={`/produtos/${product.handle}`} className="search__item" onClick={close}>
                    <span className="search__thumb">
                      {product.featuredImage ? (
                        <Image
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText ?? product.title}
                          title={product.featuredImage.altText ?? product.title}
                          width={48}
                          height={48}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <span aria-hidden="true">🕯️</span>
                      )}
                    </span>
                    <span className="search__name">{product.title}</span>
                    <span className="search__price">{formatMoney(product.priceRange.minVariantPrice)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="search__message">{isLoading ? '…' : `${t.search.noResults} “${term}”`}</p>
          )}
        </div>
      )}
    </div>
  );
}
