import Link from 'next/link';
import { PRICE_BUCKETS, TYPE_LABELS, type TypeKey } from '@/lib/filters';

// Barra lateral de filtros (Figma Frame 60): card com acordeões (Categoria · Tipos de aromas · Preço)
// e opções em checkbox. Server component, sem estado — cada opção é um link que faz toggle do param.
export default function ProductFilters({
  basePath,
  params,
  showType,
  types,
  scents,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  showType: boolean;
  types: TypeKey[];
  scents: string[];
}) {
  const href = (key: string, value: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
    if (p.get(key) === value) p.delete(key);
    else p.set(key, value);
    p.delete('after'); // filtrar reinicia a paginação
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Aroma: multi-seleção (soma/OR). Cada opção adiciona/remove o seu aroma da lista `scent` (vírgulas).
  const selectedScents = (params.scent ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  const scentHref = (s: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== 'scent') p.set(k, v);
    const next = selectedScents.includes(s) ? selectedScents.filter((x) => x !== s) : [...selectedScents, s];
    if (next.length) p.set('scent', next.join(','));
    p.delete('after');
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const anyActive = !!(params.type || params.scent || params.price);
  const showTypeRow = showType && types.length > 1;

  const Chevron = () => <i className="fa-solid fa-chevron-down facet__chev" aria-hidden="true" />;
  const Opt = ({ url, label, active }: { url: string; label: string; active: boolean }) => (
    <li>
      <Link href={url} className={`facet__opt${active ? ' is-active' : ''}`} aria-pressed={active}>
        <span className="facet__box" aria-hidden="true" />
        {label}
      </Link>
    </li>
  );

  return (
    <div className="facets-collapse">
      {/* toggle "Filtros" só no mobile (CSS-only); no desktop a sidebar mostra sempre */}
      <input type="checkbox" id="facets-toggle" className="facets-collapse__cb" />
      <label htmlFor="facets-toggle" className="facets-collapse__btn">
        <i className="fa-solid fa-sliders" aria-hidden="true" /> Filtros
      </label>
      <div className="facets">
        {showTypeRow && (
          <details className="facet" open>
            <summary className="facet__head">Categoria<Chevron /></summary>
            <ul className="facet__opts">
              {types.map((k) => (
                <Opt key={k} url={href('type', k)} label={TYPE_LABELS[k]} active={params.type === k} />
              ))}
            </ul>
          </details>
        )}

        {scents.length > 0 && (
          <details className="facet" open>
            <summary className="facet__head">Tipos de aromas<Chevron /></summary>
            <ul className="facet__opts">
              {scents.map((s) => (
                <Opt key={s} url={scentHref(s)} label={s} active={selectedScents.includes(s)} />
              ))}
            </ul>
          </details>
        )}

        <details className="facet" open>
          <summary className="facet__head">Preço<Chevron /></summary>
          <ul className="facet__opts">
            {PRICE_BUCKETS.map((b) => (
              <Opt key={b.key} url={href('price', b.key)} label={b.label} active={params.price === b.key} />
            ))}
          </ul>
        </details>

        {anyActive && (
          <Link href={basePath} className="facets__clear">
            Limpar ✕
          </Link>
        )}
      </div>
    </div>
  );
}
