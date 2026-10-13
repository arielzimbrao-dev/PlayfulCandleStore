'use client';

import { useEffect, useState, type ReactNode } from 'react';
import SortSelect from '@/components/ShopLayout/SortSelect/SortSelect';
import './ShopLayout.scss';

// Layout das listagens de produtos: filtros à esquerda (título "Filtros" + `filters`)
// e, à direita, a barra "N produtos · Ordenar" seguida dos produtos (`children`).
// No celular os filtros viram uma gaveta que desliza da esquerda, igual ao menu do site,
// aberta pelo botão "Filtrar" ao lado da ordenação.
// Sem resultados, mostra a mensagem de "nada com estes filtros" no lugar dos produtos.
export default function ShopLayout({
  filters,
  resultCount,
  sortValue,
  children,
}: {
  filters: ReactNode;
  resultCount: number;
  /** Ordenação atual; sem ela, a ordenação e a contagem não aparecem (ex.: pesquisa). */
  sortValue?: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  // Esc fecha a gaveta, como no menu.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setIsOpen(false);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const countLabel = `${resultCount} ${resultCount === 1 ? 'produto' : 'produtos'}`;

  return (
    <div className={`shop-layout${isOpen ? ' is-open' : ''}`}>
      <aside className="shop-layout__sidebar" id="shop-filters" aria-label="Filtros">
        <div className="shop-layout__drawer-head">
          <span>Filtros</span>
          <button type="button" className="shop-layout__close" onClick={close} aria-label="Fechar filtros">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <h2 className="script-title shop-layout__filters-title">Filtros</h2>
        <div className="shop-layout__drawer-body">{filters}</div>
        <div className="shop-layout__drawer-foot">
          <button type="button" className="btn btn--primary" onClick={close}>
            Ver {countLabel}
          </button>
        </div>
      </aside>
      <div className="shop-layout__overlay" onClick={close} aria-hidden="true" />

      <div>
        <div className={`shop-layout__toolbar${sortValue ? '' : ' shop-layout__toolbar--mobile-only'}`}>
          <button
            type="button"
            className="shop-layout__filter-button"
            aria-expanded={isOpen}
            aria-controls="shop-filters"
            onClick={() => setIsOpen(true)}
          >
            Filtrar <i className="fa-solid fa-sliders" aria-hidden="true" />
          </button>
          {sortValue && (
            <>
              <p className="shop-layout__count">{countLabel}</p>
              <SortSelect value={sortValue} />
            </>
          )}
        </div>
        {resultCount > 0 ? children : <p className="empty-state">Nada com estes filtros. Experimenta limpar. ✨</p>}
      </div>
    </div>
  );
}
