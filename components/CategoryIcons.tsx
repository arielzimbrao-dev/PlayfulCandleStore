'use client';

import Link from 'next/link';

// Fila de categorias em círculos gradiente (como no mockup), com squiggles nas pontas.
const ITEMS = [
  { icon: 'fa-fire-flame-curved', label: 'Velas', href: '/categorias/velas-de-copo' },
  { icon: 'fa-layer-group', label: 'Snapbars', href: '/categorias/snapbars' },
  { icon: 'fa-cubes-stacked', label: 'Wax Melts', href: '/categorias/wax-melts' },
  { icon: 'fa-heart', label: 'Coleções', href: '/colecoes' },
  { icon: 'fa-gift', label: 'Presentes', href: '/categorias/packs' },
];

function Squiggle() {
  return (
    <svg className="squiggle" viewBox="0 0 100 44" fill="none" strokeWidth="7" strokeLinecap="round" aria-hidden="true">
      <path d="M6,14 C20,2 30,26 44,14 C58,2 68,26 82,14" stroke="#ff7a1f" />
      <path d="M6,24 C20,12 30,36 44,24 C58,12 68,36 82,24" stroke="#ff4d7d" />
      <path d="M6,34 C20,22 30,46 44,34 C58,22 68,46 82,34" stroke="#ffc42e" />
    </svg>
  );
}

export default function CategoryIcons() {
  return (
    <section className="caticons" aria-label="Categorias">
      <Squiggle />
      <div className="caticons__row">
        {ITEMS.map((i) => (
          <Link key={i.label} href={i.href} className="caticon">
            <span className="caticon__c"><i className={`fa-solid ${i.icon}`} aria-hidden="true" /></span>
            <span className="caticon__l">{i.label}</span>
          </Link>
        ))}
      </div>
      <Squiggle />
    </section>
  );
}
