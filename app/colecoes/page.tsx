import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCollections } from '@/lib/shopify';
import { NON_COLLECTION_HANDLES } from '@/lib/categories';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import './collections-page.scss';

export const metadata: Metadata = {
  title: 'Coleções',
  description: 'Explora as coleções sazonais e especiais da Playful Candles.',
  alternates: { canonical: '/colecoes' },
};

export const revalidate = 3600;

// Foto de capa para coleções que não têm imagem na Shopify.
const FALLBACK_COVERS: Record<string, string> = { 'colecao-de-outono': '/images/colecao-outono-card.jpg' };

// /colecoes: migalhas + título em duas cores + intro; cards no estilo dos cards de produto
// (cartão branco r32, foto r24, nome rosa, botão laranja "Explorar coleção").
export default async function CollectionsPage() {
  const allCollections = await getCollections(50);
  const collections = allCollections.filter((collection) => !NON_COLLECTION_HANDLES.has(collection.handle));

  return (
    <section className="container">
      <Breadcrumbs
        items={[
          { name: 'Início', url: '/' },
          { name: 'Coleções', url: '/colecoes' },
        ]}
      />
      <header className="collections__head">
        <p className="collections__eyebrow">Coleções</p>
        {/* Sem acentos: a fonte Genty (Demo) não tem ç/õ. */}
        <h1 className="script-title">
          <TwoToneTitle text="Escolhe o teu mood" /> <span className="script-spark" aria-hidden="true" />
        </h1>
        <p className="collections__lead">
          Edições especiais para cada estação e cada mood. Aromas pensados em conjunto, para combinares à vontade.
        </p>
      </header>

      {collections.length === 0 ? (
        <p className="collections__empty">
          Ainda não há coleções publicadas. Volta em breve, ou vê a <Link href="/produtos">loja toda</Link>.
        </p>
      ) : (
        <ul className="collections__grid">
          {collections.map((collection) => {
            const coverUrl = collection.image?.url ?? FALLBACK_COVERS[collection.handle];
            return (
              <li key={collection.id}>
                <Link href={`/colecoes/${collection.handle}`} className="collection-card">
                  <span className="collection-card__image">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={collection.image?.altText ?? collection.title}
                        fill
                        sizes="(max-width: 760px) 90vw, 30vw"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <span className="collection-card__placeholder" aria-hidden="true">
                        {collection.title}
                      </span>
                    )}
                  </span>
                  <span className="collection-card__body">
                    <span className="collection-card__name">{collection.title}</span>
                    {collection.description && (
                      <span className="collection-card__description">{collection.description}</span>
                    )}
                    <span className="collection-card__cta">
                      Explorar coleção <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
