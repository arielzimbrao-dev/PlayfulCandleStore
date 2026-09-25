'use client';

import { useT } from './LanguageProvider';

export default function SearchResultsHeader({ q, count }: { q: string; count: number }) {
  const t = useT();
  if (count > 0) {
    return (
      <>
        <p className="eyebrow-strong">{t.search.resultsFor}</p>
        <h1>
          “{q}” <span style={{ color: 'var(--ink-soft)', fontWeight: 400, fontSize: '1rem' }}>· {count}</span>
        </h1>
      </>
    );
  }
  return (
    <>
      <p className="eyebrow-strong">{t.search.noResults}</p>
      <h1>“{q}”</h1>
    </>
  );
}
