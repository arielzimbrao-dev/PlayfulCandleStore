import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trocas & devoluções',
  description: 'Política de trocas e devoluções da Playful Candles. Direito de livre resolução de 14 dias, condições e como pedir uma devolução.',
  alternates: { canonical: '/devolucoes' },
};

export default function DevolucoesPage() {
  return (
    <article className="container prose">
      <h1>Trocas &amp; devoluções</h1>
      <p className="lead">Se alguma coisa não correr bem com a sua encomenda, resolvemos.</p>

      <h2>Direito de livre resolução</h2>
      <p>Ao abrigo da lei portuguesa e da UE, tem <strong>14 dias</strong> a contar da receção para devolver a sua encomenda sem necessidade de justificação, desde que os artigos estejam <strong>por usar e na embalagem original</strong>.</p>

      <h2>Como pedir</h2>
      <ul>
        <li>Contacte-nos para <a href="/contacto">iniciar a devolução</a> com o número da encomenda.</li>
        <li>Enviamos as instruções de devolução.</li>
        <li>O reembolso é processado após recebermos e verificarmos os artigos (até 14 dias).</li>
      </ul>

      <h2>Artigos danificados</h2>
      <p>Se recebeu algo partido ou com defeito, envie-nos uma foto em até 48h e substituímos ou reembolsamos sem custos.</p>

      <h2>Custos de devolução</h2>
      <p>
        Se devolver <strong>dentro do prazo de 14 dias</strong> e o produto estiver <strong>por usar e na embalagem original</strong>,
        os <strong>portes de devolução ficam por conta da Playful Candles</strong>, sem qualquer custo para si.
      </p>
      <p>
        Não são aceites devoluções de produtos <strong>já usados ou acesos</strong>, nem pedidos feitos <strong>fora do prazo legal de 14 dias</strong>.
        Esta condição não afeta os seus direitos em caso de artigo com defeito (ver «Artigos danificados» acima). Nesse caso resolvemos sempre sem custos para si.
      </p>

      <h2>Reclamações e litígios</h2>
      <p>
        Livro de Reclamações: <a href="https://www.livroreclamacoes.pt/inicio" target="_blank" rel="noopener noreferrer">livroreclamacoes.pt</a>.
        Em caso de litígio de consumo, a entidade de Resolução Alternativa de Litígios (RAL) competente é o{' '}
        <a href="https://www.cniacc.pt" target="_blank" rel="noopener noreferrer">CNIACC</a>{' '}
        (mais entidades em <a href="https://www.consumidor.gov.pt" target="_blank" rel="noopener noreferrer">consumidor.gov.pt</a>).
      </p>
    </article>
  );
}
