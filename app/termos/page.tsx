import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Termos & condições',
  description: 'Termos e condições de utilização e de venda da loja Playful Candles.',
  alternates: { canonical: '/termos' },
  robots: { index: true, follow: true },
};

export default function TermosPage() {
  return (
    <article className="container prose">
      <h1>Termos &amp; condições</h1>
      <p className="lead">
        Estes termos regulam a utilização do site e a compra de produtos da {SITE.name}. Ao encomendar, aceita estas condições.
      </p>

      <h2>1. Identificação</h2>
      <p>
        {SITE.legalName}, empresária em nome individual, NIF {SITE.nif}, com morada em{' '}
        {SITE.address.streetAddress}, {SITE.address.postalCode} {SITE.address.addressLocality}, Portugal.
        Contacto: {SITE.email}. A marca comercial é «{SITE.name}».
      </p>

      <h2>2. Produtos e preços</h2>
      <p>Os preços incluem IVA à taxa legal em vigor. Reservamo-nos o direito de corrigir erros de preço evidentes. As imagens são ilustrativas.</p>

      <h2>3. Encomendas e pagamento</h2>
      <p>O pagamento é processado no checkout seguro da Shopify (Multibanco, MB WAY, cartão, PayPal). A encomenda só é confirmada após boa cobrança.</p>

      <h2>4. Envio</h2>
      <p>Ver <a href="/envios">Envios &amp; portes</a>.</p>

      <h2>5. Devoluções</h2>
      <p>Ver <a href="/devolucoes">Trocas &amp; devoluções</a> (direito de livre resolução de 14 dias).</p>

      <h2>6. Segurança dos produtos</h2>
      <p>As velas devem ser usadas com supervisão, longe de materiais inflamáveis, crianças e animais. Segue sempre as instruções da etiqueta.</p>

      <h2>7. Resolução de litígios</h2>
      <p>
        Aplica-se a lei portuguesa. Em caso de litígio de consumo, pode recorrer ao{' '}
        <a href="https://www.livroreclamacoes.pt/inicio" target="_blank" rel="noopener noreferrer">Livro de Reclamações</a>{' '}
        e à Resolução Alternativa de Litígios de Consumo (RAL). A entidade competente é o{' '}
        <a href="https://www.cniacc.pt" target="_blank" rel="noopener noreferrer">CNIACC — Centro Nacional de Informação e Arbitragem de Conflitos de Consumo</a>.
        Podes consultar a lista de entidades RAL em{' '}
        <a href="https://www.consumidor.gov.pt" target="_blank" rel="noopener noreferrer">consumidor.gov.pt</a>.
      </p>

      <p><em>Última atualização: 15 de setembro de 2026. Documento a rever por apoio jurídico antes do lançamento.</em></p>
    </article>
  );
}
