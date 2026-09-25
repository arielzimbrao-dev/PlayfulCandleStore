# Configuração manual necessária — Playful Candles

> O código da **Fase 0 + boa parte da Fase 1** da auditoria já foi implementado. Este documento lista o que **tu** precisas de configurar (Shopify, contas externas, dados reais e legal) para o site ficar 100% operacional. Marca ✅ à medida que fazes.
>
> **Ordem sugerida:** 1) Shopify (produtos/coleções/pagamentos/envios) → 2) Dados do site (`lib/site.ts` + `.env`) → 3) SEO (Search Console, Business, Merchant) → 4) Analytics/Tags → 5) Legal.

---

## 🔥 Prioridade agora (revisão de 2026-09-22)

Estes são os itens que **bloqueiam a venda** e que só se resolvem na Shopify ou com conteúdo teu.
Detalhe técnico completo em `audit.md`.

| # | O quê | Onde | Porquê |
|---|---|---|---|
| 1 | **Fotos dos produtos** — 12 dos 18 produtos não têm foto nenhuma (incluindo o queimador) | Admin → Produtos | Os cards mostram um placeholder; é o maior travão à conversão |
| 2 | **Domínio do checkout** — hoje abre em `playfulcandles.myshopify.com` | Admin → Definições → Domínios | O cliente sai da marca a meio da compra. ⚠️ Usar um subdomínio (`checkout.playfulcandles.com`), senão choca com o site headless |
| 3 | **SKU (e EAN, se houver)** em todas as variantes | Admin → Produtos → Variantes | Sem isto o Google Shopping fica limitado e o schema usa o ID interno |
| 4 | **Scope `unauthenticated_read_product_inventory`** no canal Headless | Admin → Apps → Headless | Sem ele não dá para mostrar "Só restam N" |
| 5 | **Emails de carrinho abandonado** | Admin → Marketing → Automações | Nativo da Shopify, recupera vendas sem newsletter |
| 6 | **Customer Events → GA4** (evento `purchase`) | Admin → Definições → Eventos de cliente | Sem isto não há ROAS: o site mede até ao checkout, a compra acontece na Shopify |
| 7 | **Tabela de portes** abaixo de €35 (e ilhas) | Admin → Envios + `app/envios/page.tsx` | Há um `TODO` na página; o preço tem de estar pré-divulgado |
| 8 | **Checkbox de aceitação dos termos** no checkout | Admin → Definições → Checkout | Na UE o browsewrap é frágil |
| 9 | **Preço do queimador (€5)** e **controlo de stock** | Admin → Produtos | €5 é o preço de uma snapbar; confirmar se é provisório. Todos os produtos aparecem disponíveis |
| 10 | **Pack de 3 snapbars por €13,50** | Admin → Produtos/Descontos | A categoria Packs está vazia e há textos que prometem o pack |

### Moderação de avaliações
As avaliações já funcionam no site (formulário na página de produto). Entram como **pendentes** e
**só aparecem depois de aprovadas**: no metafield `custom.reviews` do produto, põe `approved: true`
na avaliação. O `scripts/reviews.mjs` ajuda a listar/aprovar.

---

## ✅ O que já ficou pronto no código (para contexto)
- SEO técnico: `sitemap.xml`, `robots.txt`, `llms.txt`, metadata + canonical por página, JSON‑LD (Organization/LocalBusiness, WebSite+Search, Product, Breadcrumb, FAQPage).
- Shopify: `@inContext(country: PT)` (EUR/mercado correto), `buyerIdentity` no checkout, **cache ISR (1h)** + rota de revalidação por webhook, preços de saldo (`compareAtPrice`), pesquisa sanitizada, recomendações de produto.
- PDP redesenhada (galeria, variantes, quantidade, saldo, breadcrumbs, descrição rica, cross‑sell, responsiva).
- Carrinho: miniaturas das linhas + barra de "portes grátis".
- Páginas: `/faq`, `/envios`, `/devolucoes`, `/termos`, `/privacidade`, `/sobre`, `/contacto`, `/colecoes`, 404/erro.
- Analytics/Consent: GTM/GA4/Ads atrás de env + Consent Mode v2 + banner de cookies **granular** (medição vs marketing, com registo de versão/data).
- Avaliações de produtos com moderação, anti-spam (honeypot + limite por IP) e `AggregateRating` no schema.
- Mensagem de oferta no carrinho (vai como nota da encomenda, visível no admin).
- Pesquisa do header com `predictiveSearch` (tolera gralhas, encontra por aroma).

---

## 1. Shopify — Admin

### 1.1 Canal Headless & tokens (obrigatório para o site ligar)
- [ ] Instalar/abrir o canal **Headless** (ou **Hydrogen/Custom app**) na Shopify.
- [ ] Copiar o **domínio** e os **Storefront API tokens** (público e, idealmente, privado/delegate).
- [ ] Preencher em `.env.local` (ver §4):
  - `SHOPIFY_STORE_DOMAIN` (ex.: `playfulcandles.myshopify.com`)
  - `SHOPIFY_STOREFRONT_PUBLIC_TOKEN` e/ou `SHOPIFY_STOREFRONT_PRIVATE_TOKEN`
- [ ] Garantir que a Storefront API tem acesso a: produtos, coleções, `productRecommendations`, checkout/cart.

### 1.2 Coleções (⚠️ o menu depende disto)
O menu/footer apontam para estas **handles exatas**. Estado atual verificado na tua Shopify:
| Menu | Handle | Estado |
|---|---|---|
| Velas | `velas-de-copo` | ✅ já existe |
| Wax Melts | `wax-melts` | ✅ já existe |
| Snapbars | `snapbars` | ✅ já existe |
| Queimadores | `queimadores` | ⚠️ **não existe** (sem coleção nem produtos) |

- [ ] **Queimadores**: adicionar produtos do tipo "Queimador" e **criar a coleção com a handle `queimadores`**. Enquanto não existir, o site mostra uma página **"em breve"** (não dá 404).
- [ ] (Opcional) Confirmar/ajustar as condições das coleções existentes (por `Tipo de produto` ou `Tag`).
- [ ] (Opcional) Imagem e descrição de cada coleção (aparecem em `/colecoes` e no SEO).
- [ ] Garantir que as coleções estão publicadas no canal Headless/Online Store.
> Se mudares uma handle na Shopify, avisa para atualizar os links do menu/footer (`components/Header/index.tsx` e `components/Footer.tsx`).

### 1.3 Produtos
- [ ] **Tipo de produto** (`productType`) coerente: usar `Vela de Copo`, `Snapbar`, `Wax Melt`, `Queimador`, `Pack` — o site deriva a etiqueta/categoria daqui.
- [ ] **Fotos**: adicionar **2+ fotos por produto** (a 1ª é a de capa). ➜ ativa o **carrossel de fotos no hover** dos cards. Muitos produtos têm 0–1 foto hoje.
- [ ] **Fotos em alta resolução** (evitar as versões pequenas do Instagram).
- [ ] **Variantes/aromas**: se um produto tem vários aromas, criar variantes (aparece o seletor na PDP).
- [ ] **Descrição** (HTML rico) — já é mostrada na PDP e usada no SEO.
- [ ] **Preço** e, para saldos, **"Preço de comparação"** (`compareAtPrice`) ➜ ativa o badge SALE e o preço riscado.
- [ ] **Inventário/stock** (o "Esgotado" e o checkout dependem disto).
- [ ] Publicar todos os produtos nos canais corretos.
- [ ] (Opcional, recomendado) **Metafields** para notas de aroma / tempo de queima / ingredientes / peso (para enriquecer a PDP no futuro).

### 1.4 Pagamentos
- [ ] Ativar **Shopify Payments** (ou gateway) com:
  - **Multibanco** e **MB WAY** (via Shopify Payments PT ou apps como o SIBS/Easypay/Ifthenpay).
  - **Cartões** (Visa/Mastercard), **PayPal**.
- [ ] Confirmar **moeda = EUR**.
- [ ] Testar um pagamento em modo de teste.

### 1.5 Envios & impostos
- [ ] Criar **zona de envio** para **Portugal continental** com a regra de **portes grátis acima de €35** (o site anuncia isto e a barra do carrinho usa €35 — se mudares o valor, avisa para ajustar `FREE_SHIPPING_THRESHOLD` no código).
- [ ] Definir tarifas para valores abaixo de €35.
- [ ] Zona separada para **Ilhas** (Açores/Madeira) se aplicável.
- [ ] Configurar **IVA** (incluído no preço, taxa PT).

### 1.6 Checkout & marca
- [ ] Personalizar o **checkout hospedado** (logo, cores) — é para lá que o site envia.
- [ ] Definir email de confirmação/marca.
- [ ] Ativar **Customer Accounts** (novas contas da Shopify) se quiseres login/histórico — o botão "A minha conta" ainda aponta para a loja até isto existir (ver Fase futura).

### 1.7 Webhooks (revalidação do cache ISR)
- [ ] Definir um segredo em `.env`: `SHOPIFY_REVALIDATE_SECRET=algum-segredo`.
- [ ] Criar webhooks (Definições → Notificações → Webhooks) para **products/update** e **collections/update** a apontar para:
  `https://SEU_DOMINIO/api/revalidate?secret=SEU_SEGREDO`
- Assim, alterações de preço/stock refrescam o site sem esperar 1h.

### 1.8 Multi‑idioma/moeda (ES/EN) — quando avançarem para internacional
- [ ] Ativar **Shopify Markets** (mercados ES/internacional) para preços/traduções por país.
- [ ] Traduzir produtos/coleções (app *Translate & Adapt*).
- *(Nota: o site traduz a interface para ES/EN no cliente; para o conteúdo Shopify em ES/EN e indexação, é preciso Markets + rotas por idioma — ver §6 Futuro.)*

---

## 2. Dados do site & ambiente (código)

### 2.1 `lib/site.ts` — preencher NAP e contactos (usado no JSON‑LD / Google Business)
- [ ] `telephone` (ex.: `+351 ...`)
- [ ] `email` real
- [ ] `address` (rua, código postal) — se houver morada/atelier público
- [ ] `legalName` (nome legal da empresa)
- [ ] Confirmar `url` (domínio final) e links de redes sociais.

### 2.2 Legal — completar os placeholders (`TODO`)
- [ ] `app/termos/page.tsx` e `app/privacidade/page.tsx`: **NIF, morada da sede, data**.
- [ ] Rever **Termos** e **Privacidade** com apoio jurídico antes do lançamento.

---

## 3. SEO — configuração externa

- [ ] **Domínio**: apontar `playfulcandles.pt` para a VPS do Coolify (registo A → IP da VPS; HTTPS via Let's Encrypt no Coolify — ver README › Deploy). Definir `NEXT_PUBLIC_SITE_URL` com o domínio final.
- [ ] **Google Search Console**: adicionar a propriedade, verificar (mete o token em `NEXT_PUBLIC_GSC_VERIFICATION` → gera a meta tag) e **submeter `/sitemap.xml`**.
- [ ] **Bing Webmaster Tools**: idem (submeter sitemap).
- [ ] **Google Business Profile** (GEO/local): criar/reclamar o perfil da marca, verificar, e usar **exatamente o mesmo NAP** de `lib/site.ts`. Ligar as redes sociais.
- [ ] **Google Merchant Center + canal "Google & YouTube" na Shopify**: criar o feed de produtos para o Shopping (o site já tem `Product` schema).
- [ ] Confirmar o **favicon** (adicionar `app/icon.png` quadrado — recomendado; não há um definido).

---

## 4. Analytics & Tags — criar contas e preencher env

Variáveis (em `.env.local`, ver `.env.local.example`):
```bash
NEXT_PUBLIC_SITE_URL=https://playfulcandles.pt
NEXT_PUBLIC_GSC_VERIFICATION=   # Search Console
NEXT_PUBLIC_GTM_ID=             # GTM-XXXXXXX
NEXT_PUBLIC_GA_ID=              # G-XXXXXXXXXX (se não usares GTM)
NEXT_PUBLIC_GOOGLE_ADS_ID=      # AW-XXXXXXXXX (dentro do GTM, normalmente)
SHOPIFY_REVALIDATE_SECRET=      # segredo do webhook
```
Passos:
- [ ] Criar container **Google Tag Manager** → meter o ID em `NEXT_PUBLIC_GTM_ID`.
- [ ] Criar propriedade **GA4** → configurar dentro do GTM (recomendado) **com Consent Mode**.
- [ ] (Opcional) **Google Ads** → tag dentro do GTM.
- [ ] No GTM, configurar os triggers para **respeitar o Consent Mode** (o site já dispara `consent: default = denied` e o banner atualiza para `granted` ao aceitar).
- [ ] Testar com o *Tag Assistant* que nada dispara antes do consentimento.

> ⚠️ **RGPD:** as tags só devem disparar após aceitação no banner. O código já implementa Consent Mode v2 + banner; só precisas dos IDs e da configuração no GTM.

---

## 5. Conteúdo & apps (opcional mas recomendado)
- [ ] **App de reviews** (Judge.me / Loox / Yotpo) — hoje os testemunhos da home são de exemplo. Ao integrar, podemos mostrar reviews reais + `aggregateRating` no schema.
- [ ] **Newsletter**: ligar o formulário a Shopify Email / Klaviyo / Mailchimp (hoje o submit é decorativo). Garantir **duplo opt‑in** (RGPD).
- [ ] Fotos/vídeos reais em **alta resolução** para o **hero** (idealmente formato paisagem).

---

## 6. Deixado para fase futura (precisa de decisão/config antes de implementar)
Estes itens da auditoria dependem de configuração ou são projetos maiores:
- **Rotas por idioma `/pt` `/es` `/en` + hreflang** (SEO internacional real) — depende de Shopify Markets e é uma refação de rotas. A tradução da interface já funciona no cliente.
- **Customer Accounts** (login, histórico, seguir encomenda) — requer configurar as novas Customer Accounts na Shopify + OAuth.
- **Filtros facetados** na listagem (por aroma/preço) — a ordenação básica já existe.
- **Construtor real de Mix & Match** (packs 3/5 snapbars) — hoje é secção promocional.

---

## 7. Antes de publicar (checklist final)
- [ ] `npm run build` sem erros (correr localmente antes do deploy).
- [ ] `.env` de produção preenchido no host (tokens Shopify, site URL, analytics, segredo webhook).
- [ ] Testar: adicionar ao carrinho → checkout real (modo teste) → email de confirmação.
- [ ] Submeter sitemap no Search Console.
- [ ] Aceitar/recusar cookies e confirmar comportamento das tags.
- [ ] Rever textos legais.

---

*Dúvidas sobre qualquer passo? Diz e ajudo a configurar ou implemento o item da fase futura.*
