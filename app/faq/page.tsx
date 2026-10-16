import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd/JsonLd';
import { faqLd } from '@/lib/jsonld';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { shippingRateLabel } from '@/lib/format';
import { getShippingZones } from '@/lib/shopify/admin';

export const metadata: Metadata = {
  title: 'Perguntas frequentes (FAQ)',
  description: 'Respostas sobre as velas Playful Candles: aromas, tempo de queima, wax melts, portes, prazos de entrega em Portugal e Espanha e devoluções.',
  alternates: { canonical: '/faq' },
};

type Faq = { question: string; answer: string };

// A 1.ª frase de cada resposta é a resposta direta (é o que os motores de resposta citam).
const PRODUCT_FAQ: Faq[] = [
  { question: 'As velas são veganas?', answer: 'Sim. Usamos ceras vegetais e biodegradáveis, sem produtos de origem animal.' },
  { question: 'Quanto tempo dura uma vela?', answer: 'Uma vela de copo dura tipicamente entre 30 e 40 horas de queima, conforme o tamanho. Segue as instruções da etiqueta para a aproveitares ao máximo.' },
  { question: 'Como se usam os wax melts e os snapbars?', answer: 'Pões um wax melt (ou um cubo partido do snapbar) no prato do queimador e acendes uma vela de chá por baixo: a cera derrete e a divisão fica a cheirar em minutos. A cera não tem chama nem pavio. Para trocar de aroma, deixa a cera arrefecer e solidificar e retira-a.' },
  { question: 'O queimador é seguro?', answer: 'Sim, desde que o uses numa superfície estável e resistente ao calor e nunca deixes a vela de chá acesa sem vigilância. Mantém-no longe de crianças, animais e materiais inflamáveis, e deixa-o arrefecer por completo antes de limpar ou retirar a cera.' },
];

const SHIPPING_FAQ: Faq[] = [
  { question: 'Para onde enviam?', answer: 'Enviamos para Portugal continental e Espanha peninsular. Expedimos a encomenda em até 24 horas em dias úteis (ao fim de semana e em feriados segue no dia útil seguinte).' },
  { question: 'Enviam para os Açores, a Madeira ou as Canárias?', answer: 'Não. Por agora só entregamos em Portugal continental e Espanha peninsular, por isso não enviamos para os Açores, Madeira, Baleares, Canárias, Ceuta nem Melilla.' },
];

const AFTER_SALE_FAQ: Faq[] = [
  { question: 'Posso devolver uma encomenda?', answer: 'Sim, tens 14 dias a contar da receção para devolver sem dar justificação, desde que os artigos estejam por usar e na embalagem original. Dentro desse prazo, os portes de devolução ficam por nossa conta. Para começar, fala connosco com o número da encomenda.' },
  { question: 'E se a encomenda chegar partida?', answer: 'Substituímos ou reembolsamos, sem custos para ti. Só precisas de nos enviar uma foto do artigo nas 48 horas seguintes à receção.' },
  { question: 'Posso oferecer como presente?', answer: 'Podes. Vai tudo bem embalado e, no carrinho, podes escrever a mensagem de oferta que segue com a encomenda.' },
  { question: 'Que métodos de pagamento aceitam?', answer: 'Multibanco, MB WAY, Visa, Mastercard e PayPal, no checkout seguro da Shopify.' },
];

export default async function FaqPage() {
  // Portes e prazos lidos da Shopify (os mesmos de /envios); sem eles, a pergunta dos portes
  // remete para o checkout e as dos prazos não aparecem.
  const zones = await getShippingZones();
  const rates = zones.filter((zone) => zone.rates.length);
  const faq: Faq[] = [
    ...PRODUCT_FAQ,
    ...SHIPPING_FAQ,
    {
      question: 'Quanto custam os portes?',
      answer: rates.length
        ? `Os portes dependem do peso da encomenda: ${rates.map((zone) => `${shippingRateLabel(zone.rates)} para ${zone.name}`).join(' e ')}. O valor exato aparece no checkout, antes de pagares.`
        : 'Os portes dependem do peso total da encomenda. O valor exato aparece no checkout, antes de pagares.',
    },
    ...zones
      .filter((zone) => zone.days)
      .map((zone) => ({
        question: `Quanto demora a entrega para ${zone.name}?`,
        answer: `Entre ${zone.days!.min} e ${zone.days!.max} dias úteis depois da expedição. Expedimos em até 24 horas em dias úteis; encomendas feitas ao fim de semana ou em feriados seguem no dia útil seguinte.`,
      })),
    ...AFTER_SALE_FAQ,
  ];

  return (
    <>
      <JsonLd data={faqLd(faq)} />
      <article className="container prose accordion">
        <Breadcrumbs items={[{ name: 'Início', url: '/' }, { name: 'Perguntas frequentes', url: '/faq' }]} />
        <h1>Perguntas frequentes</h1>
        <p className="lead">As perguntas que nos fazem mais vezes. Se faltar alguma, manda mensagem.</p>
        {faq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </article>
    </>
  );
}
