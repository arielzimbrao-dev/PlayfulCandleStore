import Link from 'next/link';
import type { ReactNode } from 'react';
import { PRICE_BUCKETS, TYPE_LABELS, type CategoryKey } from '@/lib/filters';
import './ProductFilters.scss';

type SearchParams = Record<string, string | undefined>;

// Monta a URL da listagem com os parâmetros dados. Filtrar sempre volta para a 1.ª página.
function buildUrl(basePath: string, params: URLSearchParams) {
  params.delete('after');
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="filter-group" open>
      <summary className="filter-group__title">
        {title}
        <i className="fa-solid fa-chevron-down filter-group__chevron" aria-hidden="true" />
      </summary>
      <ul className="filter-group__options">{children}</ul>
    </details>
  );
}

function FilterOption({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <li>
      <Link href={href} className={`filter-group__option${isActive ? ' is-active' : ''}`} aria-pressed={isActive}>
        <span className="filter-group__checkbox" aria-hidden="true" />
        {label}
      </Link>
    </li>
  );
}

// Barra lateral de filtros (Figma Frame 60): cartão com grupos em acordeão
// (Categoria · Tipos de aromas · Preço · Disponibilidade) e opções com checkbox.
// Componente de servidor sem estado: cada opção é um link que liga/desliga o parâmetro na URL.
// No celular a gaveta que abre/fecha fica no ShopLayout.
export default function ProductFilters({
  basePath,
  params,
  showType,
  types,
  scents,
  stockFilter = false,
}: {
  basePath: string;
  params: SearchParams;
  showType: boolean;
  types: CategoryKey[];
  scents: string[];
  /** Mostra o grupo "Disponibilidade › Em stock" (parâmetro `stock=1`). */
  stockFilter?: boolean;
}) {
  const currentParams = () => {
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) urlParams.set(key, value);
    return urlParams;
  };

  // Filtros de escolha única (categoria, preço, estoque): clicar de novo na opção ativa desliga.
  const toggleHref = (key: string, value: string) => {
    const urlParams = currentParams();
    if (urlParams.get(key) === value) urlParams.delete(key);
    else urlParams.set(key, value);
    return buildUrl(basePath, urlParams);
  };

  // Aroma é de escolha múltipla (OU): cada opção entra/sai da lista `scent`, separada por vírgulas.
  const selectedScents = (params.scent ?? '')
    .split(',')
    .map((scent) => scent.trim())
    .filter(Boolean);
  const scentHref = (scent: string) => {
    const urlParams = currentParams();
    const nextScents = selectedScents.includes(scent)
      ? selectedScents.filter((selected) => selected !== scent)
      : [...selectedScents, scent];
    if (nextScents.length) urlParams.set('scent', nextScents.join(','));
    else urlParams.delete('scent');
    return buildUrl(basePath, urlParams);
  };

  const hasActiveFilter = !!(params.type || params.scent || params.price || params.stock);
  const showTypeGroup = showType && types.length > 1;

  return (
    <div className="filters">
      {showTypeGroup && (
        <FilterGroup title="Categoria">
          {types.map((type) => (
            <FilterOption key={type} href={toggleHref('type', type)} label={TYPE_LABELS[type]} isActive={params.type === type} />
          ))}
        </FilterGroup>
      )}

      {scents.length > 0 && (
        <FilterGroup title="Tipos de aromas">
          {scents.map((scent) => (
            <FilterOption key={scent} href={scentHref(scent)} label={scent} isActive={selectedScents.includes(scent)} />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Preço">
        {PRICE_BUCKETS.map((bucket) => (
          <FilterOption
            key={bucket.key}
            href={toggleHref('price', bucket.key)}
            label={bucket.label}
            isActive={params.price === bucket.key}
          />
        ))}
      </FilterGroup>

      {stockFilter && (
        <FilterGroup title="Disponibilidade">
          <FilterOption href={toggleHref('stock', '1')} label="Em stock" isActive={params.stock === '1'} />
        </FilterGroup>
      )}

      {hasActiveFilter && (
        <Link href={basePath} className="filters__clear">
          Limpar ✕
        </Link>
      )}
    </div>
  );
}
