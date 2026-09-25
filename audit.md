# Auditoria — Playful Candles Storefront

> **Data:** 2026-09-22 · Substitui a auditoria de 2026-09-16.
> Revisão do e-commerce completo: código lido de ponta a ponta, site testado a correr (localhost),
> chamadas reais à API do carrinho e ao catálogo da Shopify.
> Severidade: **P0** (bloqueia o lançamento) · **P1** (importante) · **P2** (melhoria).

---

## 0. Estado

O storefront está funcional: navegação, filtros, pesquisa, carrinho com cookie httpOnly, checkout
em 2 cliques, "Comprar agora", favoritos, SEO técnico e JSON-LD sólidos. Todos os links internos
respondem 200 e não há overflow horizontal no mobile.

O que falta para vender está hoje mais do lado do **conteúdo e da configuração da Shopify** do que
do código: 12 dos 18 produtos não têm foto, nenhuma variante tem SKU e o checkout ainda abre em
`playfulcandles.myshopify.com`.

### Corrigido nesta revisão (2026-09-22)

| Correção | Ficheiros |
|---|---|
| Avaliações renderizadas na PDP (o `ProductReviews` não era usado em lado nenhum — o `/api/reviews`, a moderação e o `AggregateRating` estavam inalcançáveis) | `app/produtos/[handle]/page.tsx` |
| Copy do acordeão por tipo de produto (o queimador de cerâmica dizia "cera 100% vegetal" e "apara o pavio") | `app/produtos/[handle]/page.tsx` |
| JSON-LD: `shippingRate` €0 só quando o produto passa o limite de portes grátis (antes declarava portes grátis sempre) | `lib/jsonld.ts` |
| GA4: `begin_checkout` passou a usar o ID do produto, igual a `view_item`/`add_to_cart` (funil estava partido) | `lib/shopify/queries.ts`, `CartDrawer.tsx`, `app/carrinho/page.tsx` |
| API Shopify 2025-01 → **2026-07** (Storefront + Admin) | `lib/shopify/client.ts`, `lib/shopify/admin.ts` |
| `cartDiscountCodesUpdate`: `[String!]` → `[String!]!` (a 2026-07 tornou o argumento obrigatório; sem isto **todos** os códigos davam 422) | `lib/shopify/mutations.ts` |
| Sitemap sem `/colecoes/frontpage` (coleção vazia da Shopify) nem categorias sem produtos (renderizam "em breve" com noindex) | `app/sitemap.ts`, `lib/categories.ts` |
| Código de desconto inválido deixa de ficar agarrado ao carrinho | `components/cart-context.tsx` |
| `GET /api/cart` e corpos JSON inválidos deixam de dar 500 | `app/api/cart/route.ts` |
| Aviso ao cliente quando a Shopify corta a quantidade por falta de stock (campo `warnings`) | `lib/shopify/mutations.ts`, `cart-context.tsx` |
| WhatsApp/Meta na política de privacidade (subcontratante, número visível no grupo) e avaliações na lista de dados | `app/privacidade/page.tsx` |
| Consentimento granular (medição vs marketing) com registo de versão e data | `components/CookieConsent.tsx` |
| Anti-spam nas avaliações: honeypot + limite de 5/hora por IP | `app/api/reviews/route.ts` |
| Mensagem de oferta no carrinho (vai como nota da encomenda) | `app/carrinho/page.tsx`, `lib/shopify/*` |
| Pesquisa do header com `predictiveSearch` (tolera gralhas, encontra por aroma) | `lib/shopify/queries.ts`, `app/api/search/route.ts` |
| "Comprar agora" deixou de arrastar o carrinho existente; `/carrinho` já não pisca vazio; loading por linha | `app/api/cart/route.ts`, `cart-context.tsx` |
| Menu de coleções vindo da Shopify (handle de outono deixou de estar no código) | `app/layout.tsx`, `components/Header` |
| Footer sem "Sobre" duplicado, com TikTok e Pinterest | `components/Footer.tsx` |
| Galeria sem `role="tab"` inválido; banner de cookies já não tapa o CTA no mobile | `ProductGallery.tsx`, `styles/global.scss` |
| Klarna removido (não é meio de pagamento da loja); prazo de expedição com asterisco de dias úteis | `lib/i18n.ts`, `components/Appeals.tsx` |
| Humanize à copy dos três idiomas e às páginas de conteúdo | `lib/i18n.ts`, `app/*/page.tsx` |

---


### Envios configurados na Shopify (2026-09-22)

| Zona | Cobertura | Tarifa |
|---|---|---|
| Portugal continental | 18 distritos (sem Açores nem Madeira) | €5,99 · grátis a partir de €35 |
| España peninsular | 47 províncias (sem Baleares, Canárias, Ceuta, Melilla) | €16, sem oferta de portes |

Mercado renomeado para **Península Ibérica** (PT + ES); o checkout já só oferece esses dois países.
Confirmado por API e no checkout real: €15 → €5,99 · €45 → grátis · ilhas e França → sem opções de envio.

**Por fazer no admin (a API não permite):**
- Renomear as duas tarifas de Portugal (chamam-se Padrão) e acrescentar-lhes a estimativa de entrega.
  O checkout está a anunciar uma entrega a 7-9 dias, o que contradiz a promessa de expedição em 24h.
- Idioma da loja: o único idioma publicado é **inglês**, por isso o checkout e os emails de encomenda
  saem em inglês numa loja PT-PT.
- IVA/OSS para vendas a Espanha.
- Stock real muito baixo (1 a 10 unidades por produto).

---

## 1. Bloqueadores de lançamento (P0) — configuração/conteúdo

| # | Problema | Onde se resolve |
|---|---|---|
| 1 | **12 de 18 produtos sem foto nenhuma** (incluindo o único queimador). Os cards mostram placeholder. | Admin Shopify |
| 2 | **Checkout abre em `playfulcandles.myshopify.com`** — o cliente sai da marca a meio da compra. ⚠️ Se o domínio principal da Shopify for `playfulcandles.com`, o checkout aponta para o próprio site headless: usar um subdomínio (`checkout.playfulcandles.com`). | Admin Shopify → Domínios |

## 2. Importante (P1)

| # | Problema | Onde |
|---|---|---|
| 3 | **Nenhuma variante tem SKU nem EAN** → Google Shopping limitado; o JSON-LD usa o GID como `sku`. | Admin Shopify |
| 4 | **Sem "Só restam N"** — o token Storefront não tem o scope `unauthenticated_read_product_inventory`. | App Headless |
| 10 | **Falta o formulário de livre resolução** (Anexo do DL 24/2014) e a checkbox de aceitação dos termos no checkout. | `app/devolucoes` + Admin |
| 11 | **Barra de portes grátis usa o subtotal antes do desconto** — pode dizer "grátis" e a Shopify cobrar. | `CartDrawer.tsx`, `app/carrinho/page.tsx` |

## 3. Melhorias (P2)

- **Idiomas:** ES/EN traduzem a interface mas não têm URL indexável, e o conteúdo Shopify continua em PT. Decisão tomada: manter ES/EN e tirar as strings PT do código (feito nas páginas de carrinho).
- **Webhook de revalidação sem HMAC** — aceitável (só limpa cache, protegido por segredo no header), mas fica registado.
- **Barra de portes grátis usa o subtotal antes do desconto** — por confirmar com um código real. `CartDrawer.tsx`, `app/carrinho/page.tsx`
- **Texto do hero em desktop está dentro de `/images/hero.png`** — mudar a copy obriga a refazer a imagem.
- **"+2.000 clientes felizes"** aparece no hero, nas avaliações e no VIP: número por confirmar.

## 4. Catálogo (Admin Shopify)

- **Queimador a €5**, o mesmo preço de uma snapbar — confirmar se é provisório.
- **Nenhum produto tem `custom.peso`** — o site assume 150g e só nas velas.
- **Coleções sem imagem**; a de outono também sem descrição.
- **Stock real muito baixo:** controlo de inventário está ativo (`DENY` em rutura), mas há produtos com 1 a 4 unidades. Carrinhos acima do stock são cortados pela Shopify.
- **Categoria "Packs" vazia** — há textos que prometem "3 snapbars por €13,50" sem produto nem desconto que o cumpra.

## 5. Gaps de negócio

| Oportunidade | Esforço | Nota |
|---|---|---|
| Emails de carrinho abandonado | S | Nativo da Shopify, é só ativar — não colide com a estratégia WhatsApp |
| Mensagem de oferta / nota no carrinho | S | Velas são muito compradas para oferecer (`cartNoteUpdate`) |
| Evento `purchase` no GA4 | S | Customer Events na Shopify; sem isto não há ROAS |
| Pack de 3 snapbars | M | Criar o produto ou um desconto automático |
| Cartões de oferta | S | Expor o produto da Shopify numa coleção |
| Vistos recentemente | S | localStorage + fila de produtos |

---

*Itens de configuração (Shopify, contas externas, legal) estão detalhados em `manual_required.md`.*
