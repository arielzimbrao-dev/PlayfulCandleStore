import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { faqLd } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'Perguntas frequentes (FAQ)',
  description: 'Respostas sobre as velas Playful Candles: aromas, tempo de queima, ceras vegetais, portes e prazos de entrega em Portugal.',
  alternates: { canonical: '/faq' },
};

const FAQ = [
  { q: 'As velas são veganas?', a: 'Sim. Usamos ceras vegetais e biodegradáveis, sem produtos de origem animal.' },
  { q: 'Quanto tempo dura uma vela?', a: 'Depende do tamanho, mas as velas de copo duram tipicamente entre 30 e 40 horas de queima. Segue as instruções da etiqueta para um melhor aproveitamento.' },
  { q: 'Para onde enviam?', a: 'Enviamos para Portugal continental e Espanha peninsular. Expedimos a encomenda em até 24 horas em dias úteis (ao fim de semana e em feriados segue no dia útil seguinte) e a entrega demora 24/72h a partir daí. Portes grátis acima de €35 em Portugal continental.' },
  { q: 'Como funcionam os snapbars e wax melts?', a: 'Partes um cubo do snapbar (ou colocas um wax melt), aqueces num queimador e a casa enche-se de aroma em minutos, sem chama.' },
  { q: 'Posso oferecer como presente?', a: 'Podes. Vai tudo bem embalado e, no carrinho, podes escrever a mensagem de oferta que segue com a encomenda.' },
  { q: 'Que métodos de pagamento aceitam?', a: 'Multibanco, MB WAY, Visa, Mastercard e PayPal, no checkout seguro da Shopify.' },
];

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqLd(FAQ)} />
      <article className="container prose faq">
        <h1>Perguntas frequentes</h1>
        <p className="lead">As perguntas que nos fazem mais vezes. Se faltar alguma, manda mensagem.</p>
        {FAQ.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </article>
    </>
  );
}
