'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container status-page">
      <p className="eyebrow eyebrow--large">Ups</p>
      <h1>Algo correu mal</h1>
      <p className="status-page__text">
        Aconteceu um problema a carregar esta página. Tenta novamente daqui a pouco.
      </p>
      <button className="btn btn--primary" onClick={reset}>Tentar de novo</button>
    </section>
  );
}
