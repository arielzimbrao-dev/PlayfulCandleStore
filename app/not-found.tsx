import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="container" style={{ textAlign: 'center', minHeight: '48vh' }}>
      <p className="eyebrow-strong">Erro 404</p>
      <h1>Página não encontrada</h1>
      <p style={{ margin: '16px auto 24px', maxWidth: '40ch', color: 'var(--ink-soft)' }}>
        Ups! Esta página não existe ou foi movida. Vamos levar-te de volta ao bom mood.
      </p>
      <Link className="btn btn--primary" href="/">Voltar à loja</Link>
    </section>
  );
}
