import Link from 'next/link';
import JsonLd from '@/components/JsonLd/JsonLd';
import { breadcrumbLd } from '@/lib/jsonld';
import './Breadcrumbs.scss';

// Trilha "Início › Loja › Produto" + o JSON-LD equivalente para o Google.
// O último item é a página atual (sem link).
export default function Breadcrumbs({ items }: { items: { name: string; url: string }[] }) {
  return (
    <>
      <JsonLd data={breadcrumbLd(items)} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        {items.map((item, index) =>
          index < items.length - 1 ? (
            <span key={item.url}>
              <Link href={item.url}>{item.name}</Link> <span aria-hidden="true">›</span>
            </span>
          ) : (
            <span key={item.url} aria-current="page">
              {item.name}
            </span>
          ),
        )}
      </nav>
    </>
  );
}
