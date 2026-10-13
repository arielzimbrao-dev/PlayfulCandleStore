'use client';

import { useCallback, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SORT_OPTIONS } from '@/lib/sort';
import { useDismiss } from '@/components/useDismiss';
import './SortSelect.scss';

// Menu "Ordenar ⌄": abre uma lista com ✓ na opção ativa.
// Ao escolher, navega mantendo os outros parâmetros da URL (filtros, pesquisa).
export default function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(rootRef, isOpen, close);

  const currentLabel = SORT_OPTIONS.find((option) => option.key === value)?.label ?? 'Ordenar';

  const choose = (sortKey: string) => {
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortKey);
    params.delete('after'); // mudar a ordem volta para a 1.ª página
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="sort-select" ref={rootRef}>
      <button
        type="button"
        className="sort-select__button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Ordenar: ${currentLabel}`}
        onClick={() => setIsOpen((open) => !open)}
      >
        {/* Desktop: "Ordenar ⌄". Celular: botão com a ordenação atual (ver SortSelect.scss). */}
        <span className="sort-select__desktop">
          Ordenar <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} aria-hidden="true" />
        </span>
        <span className="sort-select__mobile">
          <span className="sort-select__current">{currentLabel}</span>
          <i className="fa-solid fa-bars-staggered" aria-hidden="true" />
        </span>
      </button>
      {isOpen && (
        <ul className="sort-select__menu" role="menu">
          {SORT_OPTIONS.map((option) => (
            <li key={option.key} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={option.key === value}
                className="sort-select__option"
                onClick={() => choose(option.key)}
              >
                <span className="sort-select__check" aria-hidden="true">
                  {option.key === value ? '✓' : ''}
                </span>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
