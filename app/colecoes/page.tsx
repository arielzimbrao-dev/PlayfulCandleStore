import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCollections } from '@/lib/shopify';
import { NON_COLLECTION_HANDLES } from '@/lib/categories';

export const metadata: Metadata = {
  title: 'Coleções',
  description: 'Explora as coleções sazonais e especiais da Playful Candles.',
  alternates: { canonical: '/colecoes' },
};

export const revalidate = 3600;

const OV = ['ov-coral', 'ov-tang'];

export default async function ColecoesPage() {
  const all = await getCollections(50);
  const collections = all.filter((c) => !NON_COLLECTION_HANDLES.has(c.handle));

  return (
    <section className="container">
      <div className="sec__head">
        <div>
          <h1>Coleções</h1>
        </div>
      </div>

      {collections.length === 0 ? (
        <p style={{ marginTop: '1rem', color: 'var(--ink-soft)' }}>
          Ainda não há coleções sazonais publicadas. Volta em breve, ou vê a{' '}
          <Link href="/produtos" style={{ color: 'var(--coral-deep)', fontWeight: 700 }}>loja toda</Link>.
        </p>
      ) : (
        <div className="col-grid">
          {collections.map((c, i) => (
            <Link key={c.id} href={`/colecoes/${c.handle}`} className="tile">
              {c.image && (
                <Image
                  src={c.image.url}
                  alt={c.image.altText ?? c.title}
                  fill
                  sizes="(max-width: 760px) 100vw, 320px"
                  style={{ objectFit: 'cover' }}
                />
              )}
              <div className={`tile__ov ${OV[i % OV.length]}`} />
              <h3>{c.title}</h3>
              {c.description && <p>{c.description.slice(0, 80)}</p>}
              <span className="tile__go">Explorar →</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
