import Link from 'next/link';
import Image from 'next/image';
import TwoTone from './TwoTone';

// Banner do Pack Gourmand (home): texto + lista do que vem no pack à esquerda; foto com
// etiquetas numeradas por cima de cada produto à direita. Posições (%) batem com o recorte
// 4:3 de /images/banners/pack-gourmand.jpg — se trocar a foto, rever ITEMS[].pos.
// ponytail: copy só em PT e link p/ a categoria Packs — trocar pelo produto quando existir na Shopify.
const HREF = '/categorias/packs';
const ITEMS = [
  { n: 1, type: 'Vela', name: 'Cappuccino', pos: { left: '80%', top: '22%' } },
  { n: 2, type: 'Wax Melt', name: 'Cinnamon Rolls', pos: { left: '47%', top: '22%' } },
  { n: 3, type: 'Snapbar', name: 'Salted Caramel', pos: { left: '19%', top: '7%' } },
];

// Elementos de outono a flutuar à volta do cartão (decorativos, SVG inline).
const MAPLE = 'M50 4 58 24 70 16 66 40 86 31 78 48 96 52 76 62 81 76 58 68 54 94 46 94 42 68 19 76 24 62 4 52 22 48 14 31 34 40 30 16 42 24Z';
function Leaf({ kind, className }: { kind: 'maple' | 'leaf' | 'acorn' | 'pumpkin'; className: string }) {
  return (
    <svg className={`pack__deco ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {kind === 'maple' && (
        <>
          <path d={MAPLE} fill="currentColor" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          <path d="M50 66v32" stroke="#8f3a17" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {kind === 'leaf' && (
        <>
          <path d="M50 4C24 22 16 50 26 76c6 12 24 18 24 18s18-6 24-18C84 50 76 22 50 4Z" fill="currentColor" />
          <path d="M50 14v84M50 40l-14-10M50 56l16-12M50 72l-14-10" stroke="rgba(143,58,23,.45)" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      )}
      {kind === 'acorn' && (
        <>
          <ellipse cx="50" cy="64" rx="22" ry="28" fill="#c97a3d" />
          <path d="M22 46c0-16 12-24 28-24s28 8 28 24Z" fill="#7a4a24" />
          <rect x="46" y="8" width="8" height="16" rx="4" fill="#7a4a24" />
        </>
      )}
      {kind === 'pumpkin' && (
        <>
          <ellipse cx="32" cy="60" rx="22" ry="28" fill="#e8762b" />
          <ellipse cx="68" cy="60" rx="22" ry="28" fill="#e8762b" />
          <ellipse cx="50" cy="60" rx="20" ry="30" fill="#ff9442" />
          <path d="M48 32c0-10 3-18 10-22" stroke="#6b4a2b" strokeWidth="7" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function PackBanner() {
  return (
    <section className="pack" aria-labelledby="pack-h">
      <div className="wrap pack__box">
      <Leaf kind="maple" className="pack__deco--1" />
      <Leaf kind="leaf" className="pack__deco--2" />
      <Leaf kind="acorn" className="pack__deco--3" />
      <Leaf kind="maple" className="pack__deco--4" />
      <Leaf kind="pumpkin" className="pack__deco--5" />
      <Leaf kind="leaf" className="pack__deco--6" />
      <div className="pack__in">
        <div className="pack__body">
          <p className="pack__eyebrow">Novo · Edição de Outono</p>
          <h2 id="pack-h" className="script-title pack__title"><TwoTone text="Pack Gourmand" /></h2>
          <p className="pack__lead">
            Três aromas doces num só pack, para a casa cheirar a pastelaria acabada de abrir. Perfeito para
            oferecer, ou para te mimares.
          </p>
          <ol className="pack__list">
            {ITEMS.map((i) => (
              <li key={i.n}>
                <span className="pack__n" aria-hidden="true">{i.n}</span>
                <span>1 {i.type} de <strong>{i.name}</strong></span>
              </li>
            ))}
          </ol>
          <Link href={HREF} className="pack__cta">
            Quero o meu pack <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>

        <Link href={HREF} className="pack__media" tabIndex={-1} aria-hidden="true">
          <Image
            src="/images/banners/pack-gourmand.jpg"
            alt=""
            fill
            sizes="(max-width: 900px) 90vw, 50vw"
            quality={90}
            style={{ objectFit: 'cover' }}
          />
          {ITEMS.map((i) => (
            <span key={i.n} className="pack__tag" style={i.pos}>
              <b>{i.n}</b>
              <span className="pack__tag-l">{i.type} · {i.name}</span>
            </span>
          ))}
        </Link>
      </div>
      </div>
    </section>
  );
}
