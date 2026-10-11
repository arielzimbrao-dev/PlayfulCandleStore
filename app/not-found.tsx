import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container">
    <Breadcrumbs
        items={[
          { name: 'Início', url: '/' },
          { name: 'Página não encontrada', url: '/404' }
        ]}
      />
    <section className="container status-page">
      <p className="eyebrow eyebrow--large">Erro 404</p>
      <h1>Página não encontrada</h1>
      <p className="status-page__text">
        Ups! Esta página não existe ou foi movida. Vamos levar-te de volta ao bom mood.
      </p>
      <Link className="btn btn--primary" href="/">Voltar à loja</Link>
    </section>
  </div>
  );
}
