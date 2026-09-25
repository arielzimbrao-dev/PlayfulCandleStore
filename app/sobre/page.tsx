import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'A nossa história',
  description: 'Playful Candles nasceu em Lisboa: velas artesanais feitas à mão, com ceras vegetais e muito bom mood. Conhece a nossa história.',
  alternates: { canonical: '/sobre' },
};

export default function SobrePage() {
  return (
    <article className="container prose">
      <h1>A nossa história</h1>
      <p className="lead">Somos a Playful Candles. Fazemos velas à mão em Lisboa, com muito bom mood. 💗</p>

      <p>Começámos numa cozinha em Lisboa, a derreter cera ao fim do dia. Continuamos a fazer tudo à mão, vela a vela, com <strong>cera vegetal e biodegradável</strong> e fragrâncias que testamos antes de pôr à venda.</p>

      <h2>O que nos move</h2>
      <ul>
        <li>Fazemos tudo em Portugal, em lotes pequenos.</li>
        <li>Usamos cera vegetal, que queima mais limpa do que a parafina.</li>
        <li>Damos-lhe cores e formas que dão vontade de deixar à vista.</li>
      </ul>

      <p>Obrigada por cheirares connosco. Segue-nos no Instagram <a href="https://www.instagram.com/theplayfulcandles/" target="_blank" rel="noopener noreferrer">@theplayfulcandles</a>.</p>
    </article>
  );
}
