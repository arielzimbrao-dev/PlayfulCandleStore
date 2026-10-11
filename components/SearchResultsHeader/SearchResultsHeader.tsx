'use client';

import { useT } from '@/components/LanguageProvider';
import './SearchResultsHeader.scss';

// Título da página de pesquisa: "Resultados para “termo” · 12" ou "Sem resultados para “termo”".
export default function SearchResultsHeader({ term, count }: { term: string; count: number }) {
  const t = useT();
  return (
    <>
      <p className="eyebrow eyebrow--large">{count > 0 ? t.search.resultsFor : t.search.noResults}</p>
      <h1>
        “{term}”{count > 0 && <span className="search-results__count"> · {count}</span>}
      </h1>
    </>
  );
}
