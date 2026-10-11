import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="container status-page">
      <p className="eyebrow eyebrow--large">Erro 404</p>
      <h1>Página não encontrada</h1>
      <p className="status-page__text">
        Ups! Esta página não existe ou foi movida. Vamos levar-te de volta ao bom mood.
      </p>
      <Link className="btn btn--primary" href="/">Voltar à loja</Link>
    </section>
  );
}
