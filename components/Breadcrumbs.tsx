import Link from 'next/link';
import JsonLd from './JsonLd';
import { breadcrumbLd } from '@/lib/jsonld';

export default function Breadcrumbs({ items }: { items: { name: string; url: string }[] }) {
  return (
    <>
      <JsonLd data={breadcrumbLd(items)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        {items.map((it, i) =>
          i < items.length - 1 ? (
            <span key={it.url}>
              <Link href={it.url}>{it.name}</Link> <span aria-hidden="true">›</span>
            </span>
          ) : (
            <span key={it.url} aria-current="page">{it.name}</span>
          ),
        )}
      </nav>
    </>
  );
}
