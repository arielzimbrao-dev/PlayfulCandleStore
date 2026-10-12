import Image from 'next/image';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import BundleAddButton from '@/components/BundleOffer/BundleAddButton/BundleAddButton';
import { getProduct } from '@/lib/shopify';
import { getPackCodes } from '@/lib/shopify/admin';
import { productCategory } from '@/lib/filters';
import type { Product } from '@/lib/shopify/types';
import './PackBanner.scss';

// Banner do Pack Gourmand (home): texto + lista do que vem no pack à esquerda; foto com
// etiquetas numeradas por cima de cada produto à direita.
// Os produtos vêm do desconto "Pack Gourmand" na Shopify (ver getPackCodes): o botão põe 1 de cada
// no carrinho e o carrinho aplica o código. Sem o desconto ativo, o banner não aparece.
// ponytail: copy só em PT.
const PACK_TITLE = /gourmand/i;

// Posição (%) da etiqueta de cada produto na foto — bate com o recorte 4:3 de
// /images/banners/pack-gourmand.jpg; se trocar a foto ou os produtos do pack, revisar aqui.
// Produto sem posição fica só na lista.
const TAG_POSITIONS: Record<string, { left: string; top: string }> = {
  cappuccino: { left: '80%', top: '22%' },
  'cinnamon-rolls': { left: '47%', top: '22%' },
  'salt-caramel': { left: '19%', top: '7%' },
};

const TYPE_LABELS: Record<string, string> = { velas: 'Vela', wax: 'Wax Melt', snap: 'Snapbar', burner: 'Queimador' };

type PackItem = { number: number; product: Product; type: string; variantId: string | null };

async function getPackItems(): Promise<PackItem[]> {
  const pack = (await getPackCodes()).find((candidate) => PACK_TITLE.test(candidate.title));
  if (!pack) return [];
  // Mesma ordem das etiquetas da foto; produtos sem etiqueta vão para o fim.
  const tagOrder = Object.keys(TAG_POSITIONS);
  const rank = (handle: string) => (tagOrder.includes(handle) ? tagOrder.indexOf(handle) : tagOrder.length);
  const handles = [...pack.productHandles].sort((a, b) => rank(a) - rank(b));
  const products = await Promise.all(handles.map((handle) => getProduct(handle).catch(() => null)));
  return products
    .filter((product): product is Product => !!product)
    .map((product, index) => ({
      number: index + 1,
      product,
      type: TYPE_LABELS[productCategory(product) ?? ''] ?? '',
      variantId: product.variants.find((variant) => variant.availableForSale)?.id ?? null,
    }));
}

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
  const items = await getPackItems();
  if (!items.length) return null;
  const variantIds = items.map((item) => item.variantId);
  const isSoldOut = variantIds.some((id) => !id);

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
              <TwoToneTitle text="Pack Gourmand" />
            </h2>
            <p className="pack__lead">
              Três aromas doces num só pack, para a casa cheirar a pastelaria acabada de abrir. Perfeito para
              oferecer, ou para te mimares.
            </p>
            <ol className="pack__list">
              {items.map((item) => (
                <li key={item.number} className={item.variantId ? undefined : 'pack__item--soldout'}>
                  <span className="pack__number" aria-hidden="true">
                    {item.number}
                  </span>
                  {item.variantId ? (
                    <span>
                      1 {item.type} de <strong>{item.product.title}</strong>
                    </span>
                  ) : (
                    <s>
                      1 {item.type} de <strong>{item.product.title}</strong>
                      <span className="visually-hidden"> (esgotado)</span>
                    </s>
                  )}
                </li>
              ))}
            </ol>
            {isSoldOut ? (
              <p className="pack__cta pack__cta--soon">Volta em breve</p>
            ) : (
              <BundleAddButton
                variantIds={variantIds as string[]}
                label="Quero o meu pack"
                className="pack__cta"
              />
            )}
          </div>

          {/* Foto decorativa: as etiquetas repetem a lista ao lado, por isso fica fora dos leitores de tela. */}
          <div className="pack__media" aria-hidden="true">
            <Image
              src="/images/banners/pack-gourmand.jpg"
              alt=""
              fill
              sizes="(max-width: 900px) 90vw, 50vw"
              quality={90}
              style={{ objectFit: 'cover' }}
            />
            {items
              .filter((item) => TAG_POSITIONS[item.product.handle])
              .map((item) => (
                <span key={item.number} className="pack__tag" style={TAG_POSITIONS[item.product.handle]}>
                  <b>{item.number}</b>
                  <span className="pack__tag-label">
                    {item.type} · {item.product.title}
                  </span>
                </span>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
