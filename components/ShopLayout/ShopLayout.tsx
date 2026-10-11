import type { ReactNode } from 'react';
import SortSelect from '@/components/ShopLayout/SortSelect/SortSelect';
import './ShopLayout.scss';

// Layout das listagens de produtos: filtros à esquerda (título "Filtros" + `filters`)
// e, à direita, a barra "N itens · Ordenar" seguida dos produtos (`children`).
// Sem resultados, mostra a mensagem de "nada com estes filtros" no lugar dos produtos.
export default function ShopLayout({
  filters,
  resultCount,
  sortValue,
  children,
}: {
  filters: ReactNode;
  resultCount: number;
  /** Ordenação atual; sem ela, a barra "N itens · Ordenar" não aparece (ex.: pesquisa). */
  sortValue?: string;
  children: ReactNode;
}) {
  return (
    <div className="shop-layout">
      <aside className="shop-layout__sidebar">
        <h2 className="script-title shop-layout__filters-title">Filtros</h2>
        {filters}
      </aside>
      <div>
        {sortValue && (
          <div className="shop-layout__toolbar">
            <p className="shop-layout__count">
              {resultCount} {resultCount === 1 ? 'item' : 'itens'}
            </p>
            <SortSelect value={sortValue} />
          </div>
        )}
        {resultCount > 0 ? children : <p className="empty-state">Nada com estes filtros. Experimenta limpar. ✨</p>}
      </div>
    </div>
  );
}
