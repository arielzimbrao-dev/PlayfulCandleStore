'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/components/LanguageProvider';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import './CategoryNav.scss';

// "Navega por categoria" (home): 4 fotos redondas (ilustrações no estilo da marca) com o nome embaixo.
export default function CategoryNav() {
  const t = useT();
  const categories = [
    { handle: 'velas-de-copo', image: 'velas-glow', name: t.nav.velas },
    { handle: 'wax-melts', image: 'wax', name: t.nav.wax },
    { handle: 'snapbars', image: 'snap', name: t.nav.snap },
    { handle: 'queimadores', image: 'queimador', name: t.nav.burner },
  ];

  return (
    <section className="category-nav" aria-labelledby="category-nav-title">
      <div className="wrap category-nav__inner">
        <h2 id="category-nav-title" className="script-title category-nav__title">
          <TwoToneTitle text={t.catNav} /> <span className="script-spark" aria-hidden="true" />
        </h2>
        <ul className="category-nav__list">
          {categories.map((category) => (
            <li key={category.handle}>
              <Link href={`/categorias/${category.handle}`} className="category-nav__item">
                <span className="category-nav__photo">
                  <Image
                    src={`/images/categorias/cat-${category.image}.jpg`}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 40vw, 240px"
                    style={{ objectFit: 'cover' }}
                  />
                </span>
                <span className="category-nav__name">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
