'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from './LanguageProvider';
import TwoTone from '@/components/TwoTone';

// "Navega por categoria": grelha de 4, foto redonda (ilustração no estilo da marca) + nome por baixo.
export default function CategoryNav() {
  const t = useT();
  const cats = [
    { h: 'velas-de-copo', img: 'velas-glow', name: t.nav.velas },
    { h: 'wax-melts', img: 'wax', name: t.nav.wax },
    { h: 'snapbars', img: 'snap', name: t.nav.snap },
    { h: 'queimadores', img: 'queimador', name: t.nav.burner },
  ].map((c) => ({ ...c, href: `/categorias/${c.h}`, img: `/images/categorias/cat-${c.img}.jpg` }));
  return (
    <section className="catnav" aria-labelledby="catnav-h">
      <div className="wrap">
        <h2 id="catnav-h" className="script-title catnav__title">
          <TwoTone text={t.catNav} /> <span className="script-spark" aria-hidden="true">✦</span>
        </h2>
        <ul className="catnav__grid">
          {cats.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="catnav__item">
                <span className="catnav__pic">
                  <Image src={c.img} alt="" fill sizes="(max-width: 760px) 40vw, 240px" style={{ objectFit: 'cover' }} />
                </span>
                <span className="catnav__name">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
