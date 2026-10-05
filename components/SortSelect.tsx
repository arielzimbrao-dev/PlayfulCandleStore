'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SORT_OPTIONS } from '@/lib/sort';

// Dropdown de ordenação: "Ordenar ⌄" abre uma lista com ✓ na opção ativa.
// Navega preservando os restantes params (filtros/pesquisa). Fecha com Esc ou clique fora.
export default function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const choose = (key: string) => {
    setOpen(false);
    const p = new URLSearchParams(searchParams.toString());
    p.set('sort', key);
    p.delete('after');
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  };

  return (
    <div className="sortsel" ref={ref}>
      <button type="button" className="sortsel__btn" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Ordenar <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} aria-hidden="true" />
      </button>
      {open && (
        <ul className="sortsel__menu" role="menu">
          {SORT_OPTIONS.map((o) => (
            <li key={o.key} role="none">
              <button type="button" role="menuitemradio" aria-checked={o.key === value} className="sortsel__opt" onClick={() => choose(o.key)}>
                <span className="sortsel__check" aria-hidden="true">{o.key === value ? '✓' : ''}</span>
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
