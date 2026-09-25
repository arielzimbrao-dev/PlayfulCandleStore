import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Envios & portes',
  description: 'Expedição em até 24 horas e entrega em 24/72h em Portugal continental. Portes grátis acima de €35. Vê prazos e custos.',
  alternates: { canonical: '/envios' },
};

export default function EnviosPage() {
  return (
    <article className="container prose">
      <h1>Envios &amp; portes</h1>
      <p className="lead">Embalamos cada encomenda à mão para as velas chegarem inteiras.</p>

      <h2>Onde entregamos</h2>
      <p>Enviamos para <strong>Portugal continental</strong> e <strong>Espanha peninsular</strong>. Não enviamos para os Açores, Madeira, Baleares, Canárias, Ceuta nem Melilla.</p>

      <h2>Prazos de entrega</h2>
      <ul>
        <li>Preparação e expedição: <strong>até 24 horas em dias úteis</strong>. Encomendas feitas ao fim de semana ou em feriados seguem no dia útil seguinte.</li>
        <li>Entrega: normalmente <strong>24/72h</strong> após expedição (Portugal continental).</li>
      </ul>

      <h2>Custos de envio</h2>
      <ul>
        <li><strong>Portes grátis</strong> em encomendas acima de <strong>€35</strong> (Portugal continental).</li>
        <li>Abaixo de €35 (Portugal continental): <strong>€5,99</strong>.</li>
        <li>Espanha peninsular: <strong>€16</strong>, sem oferta de portes.</li>
      </ul>

      <h2>Seguimento</h2>
      <p>Recebes o número de seguimento por email assim que a encomenda for expedida.</p>
    </article>
  );
}
