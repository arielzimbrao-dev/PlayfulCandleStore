import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: 'Como a Playful Candles recolhe, usa e protege os seus dados pessoais (RGPD).',
  alternates: { canonical: '/privacidade' },
};

export default function PrivacidadePage() {
  return (
    <article className="container prose">
      <h1>Política de privacidade</h1>
      <p className="lead">Respeitamos a sua privacidade e cumprimos o RGPD. Aqui explicamos que dados tratamos e porquê.</p>

      <h2>Responsável pelo tratamento</h2>
      <p>
        {SITE.legalName} (NIF {SITE.nif}), {SITE.address.streetAddress}, {SITE.address.postalCode}{' '}
        {SITE.address.addressLocality}, Portugal. Contacto: {SITE.email}.
      </p>

      <h2>Que dados recolhemos</h2>
      <ul>
        <li>Dados de encomenda: nome, morada, email, telefone (para processar e enviar).</li>
        <li>Dados de pagamento: processados pela Shopify e pelos gateways. Não guardamos dados de cartão.</li>
        <li>Dados de navegação: cookies e analytics, só com o seu consentimento (ver banner de cookies).</li>
        <li>Avaliações de produtos: o nome (ou alcunha) e o comentário que escrever. São publicados no site após revisão, por isso não escreva dados que não queira tornar públicos.</li>
        <li>Conversas por WhatsApp: o número de telefone e o conteúdo das mensagens que nos enviar (ver secção própria abaixo).</li>
      </ul>

      <h2>Finalidades e base legal</h2>
      <ul>
        <li>Execução do contrato (encomendas).</li>
        <li>Consentimento (grupo VIP no WhatsApp, avaliações de produtos, cookies de marketing/analytics).</li>
        <li>Obrigações legais (faturação).</li>
      </ul>

      <h2>Cookies e analytics</h2>
      <p>Usamos cookies essenciais e, mediante consentimento, cookies de medição (Google Analytics) e marketing (Google Ads). Por omissão, os cookies não essenciais ficam <strong>bloqueados</strong> até que aceite. Pode alterar ou retirar o consentimento a qualquer momento em <strong>«Gerir cookies»</strong> (no rodapé).</p>

      <h2>WhatsApp</h2>
      <p>
        Usamos o <strong>WhatsApp</strong> (serviço da Meta Platforms Ireland Ltd.) para três coisas: atendimento,
        o pedido de aviso de reposição de stock («Avisa-me») e o grupo <strong>Playful VIP</strong>. Ao contactar-nos
        ou ao entrar no grupo, o seu número de telefone e as suas mensagens são tratados também pela Meta, segundo a
        política de privacidade dela. Tenha em conta que, <strong>num grupo, o seu número fica visível para os
        restantes participantes</strong>. A base legal é o seu consentimento (pode sair do grupo ou bloquear o
        contacto a qualquer momento) ou o interesse legítimo em responder a quem nos procura.
      </p>

      <h2>Partilha e conservação</h2>
      <p>Partilhamos dados apenas com prestadores necessários: <strong>Shopify</strong> (loja e checkout), transportadoras, gateways de pagamento, <strong>Google</strong> (analytics e publicidade, mediante consentimento) e <strong>Meta</strong> (WhatsApp). Conservamos os dados o tempo necessário e legalmente exigido (ex.: dados de faturação durante o prazo fiscal aplicável).</p>

      <h2>Transferências internacionais</h2>
      <p>Alguns prestadores (ex.: Shopify, Google, Meta) podem tratar dados fora do Espaço Económico Europeu. Nesses casos, a transferência é feita ao abrigo de garantias adequadas (Cláusulas Contratuais-Tipo da UE ou decisões de adequação).</p>

      <h2>Os seus direitos</h2>
      <p>Tem direito de acesso, retificação, apagamento, portabilidade e oposição. Contacte {SITE.email}. Pode reclamar junto da <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">CNPD</a>.</p>

      <p><em>Última atualização: 22 de setembro de 2026. Documento a rever por apoio jurídico antes do lançamento.</em></p>
    </article>
  );
}
