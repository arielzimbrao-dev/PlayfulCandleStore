'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SORT_OPTIONS } from '@/lib/sort';

// Dropdown de ordenação. Navega preservando os restantes params (filtros/pesquisa).
export default function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="sortsel">
      <span className="sortsel__label">Ordenar por</span>
      <select
        className="sortsel__select"
        value={value}
        aria-label="Ordenar por"
        onChange={(e) => {
          const p = new URLSearchParams(searchParams.toString());
          p.set('sort', e.target.value);
          p.delete('after');
          router.push(`${pathname}?${p.toString()}`, { scroll: false });
        }}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
