import Image from 'next/image';
import Link from 'next/link';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import { getProduct } from '@/lib/shopify';
import { getPackOptions } from '@/lib/packs';
import { withPackSavings } from '@/lib/bundle';
import { formatMoney, savingsLabel } from '@/lib/format';
import type { PackSlot } from '@/lib/shopify/types';
import './PackBanner.scss';

// Banner do Pack Outono (home): texto + lista dos itens do pack à esquerda; foto com
// etiquetas numeradas por cima de cada formato à direita.
// O pack é o produto "pack-outono" da Shopify: preço próprio e itens à escolha (custom.pack_slots);
// o botão leva à página do produto, onde se escolhe. Sem o produto, o banner não aparece.
// ponytail: copy só em PT.
const PACK_HANDLE = 'pack-outono';

// Posição (%) da etiqueta de cada formato na foto — bate com a 1.ª foto do produto pack-outono
// (vela Cappuccino, wax Cinnamon Rolls, snapbar) no recorte 4:5 com PHOTO_POSITION;
// se trocar a foto na Shopify, revisar aqui. Formato sem posição fica só na lista.
const PHOTO_POSITION = '50% 65%';
const TAG_POSITIONS: Record<string, { left: string; top: string }> = {
  velas: { left: '83%', top: '44%' },
  wax: { left: '29%', top: '42%' },
  snap: { left: '56%', top: '39%' },
};

// "Cappuccino, Pumpkin Spice ou Orange & Cinnamon"
const orList = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} ou ${names.at(-1)}` : (names[0] ?? '');

type PackItem = { number: number; slot: PackSlot; options: string[] };

// Elementos de outono flutuando em volta do cartão (decorativos, SVG inline).
// A posição, o tamanho e o ritmo de cada um ficam em PackBanner.scss (.pack__decoration--N).
const DECORATIONS: AutumnShape[] = ['maple', 'leaf', 'acorn', 'maple', 'pumpkin', 'leaf'];

type AutumnShape = 'maple' | 'leaf' | 'acorn' | 'pumpkin';

const MAPLE_LEAF_PATH =
  'M50 4 58 24 70 16 66 40 86 31 78 48 96 52 76 62 81 76 58 68 54 94 46 94 42 68 19 76 24 62 4 52 22 48 14 31 34 40 30 16 42 24Z';

function AutumnDecoration({ shape, index }: { shape: AutumnShape; index: number }) {
  return (
    <svg
      className={`pack__decoration pack__decoration--${index}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {shape === 'maple' && (
        <>
          <path d={MAPLE_LEAF_PATH} fill="currentColor" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          <path d="M50 66v32" stroke="#8f3a17" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {shape === 'leaf' && (
        <>
          <path d="M50 4C24 22 16 50 26 76c6 12 24 18 24 18s18-6 24-18C84 50 76 22 50 4Z" fill="currentColor" />
          <path
            d="M50 14v84M50 40l-14-10M50 56l16-12M50 72l-14-10"
            stroke="rgba(143,58,23,.45)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      {shape === 'acorn' && (
        <>
          <ellipse cx="50" cy="64" rx="22" ry="28" fill="#c97a3d" />
          <path d="M22 46c0-16 12-24 28-24s28 8 28 24Z" fill="#7a4a24" />
          <rect x="46" y="8" width="8" height="16" rx="4" fill="#7a4a24" />
        </>
      )}
      {shape === 'pumpkin' && (
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

export default async function PackBanner() {
  const found = await getProduct(PACK_HANDLE).catch(() => null);
  if (!found?.packSlots.length) return null;
  const [pack] = await withPackSavings([found]);
  const options = await getPackOptions(pack.packSlots).catch(() => pack.packSlots.map(() => []));
  const items: PackItem[] = pack.packSlots.map((slot, index) => ({
    number: index + 1,
    slot,
    options: options[index].map((option) => option.title),
  }));
  const photo = pack.featuredImage ?? pack.images[0];
  const price = pack.priceRange.minVariantPrice;
  const savings = pack.packSavings;
  const isSoldOut = !pack.variants.some((variant) => variant.availableForSale) || items.some((item) => !item.options.length);

  return (
    <section className="pack" aria-labelledby="pack-title">
      <div className="wrap pack__frame">
        {DECORATIONS.map((shape, index) => (
          <AutumnDecoration key={index} shape={shape} index={index + 1} />
        ))}

        <div className="pack__card">
          <div className="pack__body">
            <p className="pack__eyebrow">Novo · Edição de Outono</p>
            <h2 id="pack-title" className="script-title pack__title">
              <TwoToneTitle text={pack.title} />
            </h2>
            <p className="pack__lead">
              Monta o teu outono: escolhes os aromas da estação e nós juntamos tudo num pack. A forma mais fácil
              de experimentar os três formatos, para ti ou para oferecer.
            </p>
            <ol className="pack__list">
              {items.map((item) => (
                <li key={item.number}>
                  <span className="pack__number" aria-hidden="true">
                    {item.number}
                  </span>
                  <span>
                    1 <strong>{item.slot.label}</strong> à escolha
                    {item.options.length > 0 && <small className="pack__item-options">{orList(item.options)}</small>}
                  </span>
                </li>
              ))}
            </ol>
            <div className="pack__price">
              <span className="pack__price-label">Preço do pack</span>
              <span className="pack__price-row">
                {savings && !savings.atLeast && (
                  <span className="price-old">
                    <span className="visually-hidden">Em separado: </span>
                    {formatMoney({ amount: (Number(price.amount) + savings.amount).toFixed(2), currencyCode: price.currencyCode })}
                  </span>
                )}
                <strong className="pack__price-now">{formatMoney(price)}</strong>
                {savings && <span className="pack__save">{savingsLabel(savings)}</span>}
              </span>
              {savings && (
                <small className="pack__price-note">face à compra dos {items.length} produtos em separado</small>
              )}
            </div>
            {isSoldOut ? (
              <p className="pack__cta pack__cta--soon">Volta em breve</p>
            ) : (
              <Link href={`/produtos/${PACK_HANDLE}`} className="pack__cta">
                Monta o teu pack <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </Link>
            )}
          </div>

          {/* Foto decorativa: as etiquetas repetem a lista ao lado, por isso fica fora dos leitores de tela. */}
          <div className="pack__media" aria-hidden="true">
            {photo && (
              <Image
                src={photo.url}
                alt=""
                fill
                sizes="(max-width: 900px) 90vw, 50vw"
                quality={90}
                style={{ objectFit: 'cover', objectPosition: PHOTO_POSITION }}
              />
            )}
            {savings && (
              <span className="pack__sticker">
                <small>Poupa{savings.atLeast ? ' desde' : ''}</small>
                {formatMoney({ amount: savings.amount.toFixed(2), currencyCode: price.currencyCode })}
              </span>
            )}
            {items
              .filter((item) => TAG_POSITIONS[item.slot.type])
              .map((item) => (
                <span key={item.number} className="pack__tag" style={TAG_POSITIONS[item.slot.type]}>
                  <b>{item.number}</b>
                  <span className="pack__tag-label">{item.slot.label} à escolha</span>
                </span>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
