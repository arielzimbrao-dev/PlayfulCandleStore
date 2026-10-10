'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container" style={{ textAlign: 'center', minHeight: '48vh' }}>
      <p className="eyebrow-strong">Ups</p>
      <h1>Algo correu mal</h1>
      <p style={{ margin: '16px auto 24px', maxWidth: '40ch', color: 'var(--ink-soft)' }}>
        Aconteceu um problema a carregar esta página. Tenta novamente daqui a pouco.
      </p>
      <button className="btn btn--primary" onClick={reset}>Tentar de novo</button>
    </section>
  );
}
