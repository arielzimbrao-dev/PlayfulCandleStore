import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCollections } from '@/lib/shopify';
import { NON_COLLECTION_HANDLES } from '@/lib/categories';
import Breadcrumbs from '@/components/Breadcrumbs';
import TwoTone from '@/components/TwoTone';

export const metadata: Metadata = {
  title: 'Coleções',
  description: 'Explora as coleções sazonais e especiais da Playful Candles.',
  alternates: { canonical: '/colecoes' },
};

export const revalidate = 3600;

// Foto de capa quando a coleção não tem imagem na Shopify.
const FALLBACK: Record<string, string> = { 'colecao-de-outono': '/images/colecao-outono-card.jpg' };

// Coleções: breadcrumb + título em duas cores + intro; cards no estilo dos cards de produto
// (cartão branco r32, foto r24, nome rosa, botão laranja "Explorar").
export default async function ColecoesPage() {
  const all = await getCollections(50);
  const collections = all.filter((c) => !NON_COLLECTION_HANDLES.has(c.handle));

  return (
    <section className="container cols">
      <Breadcrumbs items={[{ name: 'Início', url: '/' }, { name: 'Coleções', url: '/colecoes' }]} />
      <header className="cols__head">
        <p className="cols__eyebrow">Coleções</p>
        {/* sem acentos: a Genty (Demo) não tem ç/õ */}
        <h1 className="script-title"><TwoTone text="Escolhe o teu mood" /> <span className="script-spark" aria-hidden="true" /></h1>
        <p className="cols__lead">Edições especiais para cada estação e cada mood. Aromas pensados em conjunto, para combinares à vontade.</p>
      </header>

      {collections.length === 0 ? (
        <p className="cols__empty">
          Ainda não há coleções publicadas. Volta em breve, ou vê a <Link href="/produtos">loja toda</Link>.
        </p>
      ) : (
        <ul className="cols__grid">
          {collections.map((c) => (
            <li key={c.id}>
              <Link href={`/colecoes/${c.handle}`} className="ccard">
                <span className="ccard__img">
                  {c.image || FALLBACK[c.handle] ? (
                    <Image src={c.image?.url ?? FALLBACK[c.handle]} alt={c.image?.altText ?? c.title} fill sizes="(max-width: 760px) 90vw, 30vw" style={{ objectFit: 'cover' }} />
                  ) : (
                    <span className="ccard__ph" aria-hidden="true">{c.title}</span>
                  )}
                </span>
                <span className="ccard__b">
                  <span className="ccard__name">{c.title}</span>
                  {c.description && <span className="ccard__text">{c.description}</span>}
                  <span className="ccard__cta">Explorar coleção <i className="fa-solid fa-arrow-right" aria-hidden="true" /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
