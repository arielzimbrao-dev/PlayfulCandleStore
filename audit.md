# Auditoria — Playful Candles Storefront

> **Data:** 2026-10-16 · Substitui a auditoria de 2026-09-22.
> Âmbito: SEO técnico, AEO/GEO (llms.txt), robots.txt, sitemap.xml, PageSpeed, design de conversão,
> fluxo de compra e bugs. Testado **em produção** (playfulcandles.com): Lighthouse 12.6 local
> (a quota da API do PageSpeed estava esgotada), curl aos cabeçalhos/estados HTTP, compra percorrida
> no browser até ao checkout (sem pagar) e leitura do código de ponta a ponta.
> Severidade: **P0** (perde vendas/indexação já) · **P1** (importante) · **P2** (melhoria).

---

## 0. Resumo

| Área | Nota | Comentário |
|---|---|---|
| PageSpeed mobile | **66** (home), 67 (loja), 66 (produto) | LCP 10,1 s / 6,7 s / 8,5 s. Desktop 86–93. |
| Acessibilidade (Lighthouse) | 90–95 | contraste, ordem de headings, roles |
| SEO (Lighthouse) | 92 | só falha a "meta description" (ver S9) |
| Best practices | 100 | |
| TTFB | 80–200 ms | bom; Cloudflare à frente |

**O que mudou desde 22/09:** o checkout já abre em `checkout.playfulcandles.com` ✅ (era P0). Todas as
40 URLs do sitemap respondem 200. Sem erros na consola. O JSON-LD de produto não inventa avaliações.

**Top 5 a atacar primeiro**
1. **LCP mobile de 8–10 s** — hero sem `fetchpriority`, logo PNG de 364 KB, fotos de produto originais sem redimensionar (P1, secção 3).
2. **Checkout em inglês** (`/en-pt`) numa loja PT-PT (P0, admin Shopify).
3. **`www.playfulcandles.com` dá erro 526** (certificado) e http→https é redirect temporário (P0, Cloudflare/Coolify).
4. **Soft-404 + canonical/OG herdados da home** (P1, código, ~30 min).
5. **Erros reais do carrinho escondidos** atrás de uma mensagem genérica, sobretudo nos packs (P1, código).

---

## 1. Infraestrutura, robots.txt, sitemap.xml

| # | Sev. | Problema | Correção |
|---|---|---|---|
| I1 | **P0** | `https://www.playfulcandles.com` → **526** (Cloudflare: certificado inválido na origem); `http://www.` → 404. Quem escreve "www" não chega à loja. | Certificado para `www` no Coolify + redirect 301 www → apex. |
| I2 | P1 | `http://playfulcandles.com` → **307/302** (temporário) em vez de 301. | Cloudflare → "Always Use HTTPS" (301), ou redirect permanente no proxy. |
| I3 | P2 | Sem cabeçalhos de segurança (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`); `x-powered-by: Next.js` exposto. | `headers()` em `next.config.ts` + `poweredByHeader: false`. |
| I4 | P2 | `logo.png`, ícones e imagens de `/public` com `max-age=14400` (4 h). | Regra de cache no Cloudflare (`/images/*`, `/icons/*` → 30 dias). |
| R1 | P1 | `robots.txt` bloqueia `/pesquisa`, mas a página é `noindex` — o Google nunca vê o noindex e pode indexar URLs de pesquisa sem conteúdo. | Tirar `/pesquisa` do `disallow` (`app/robots.ts:9`) e deixar o noindex trabalhar. |
| R2 | ok | Bots de IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) permitidos implicitamente por `User-Agent: *`. | Nada a fazer, salvo querer bloquear algum. |
| M1 | P2 | Sitemap sem `lastmod` nas 40 URLs; `priority`/`changefreq` são ignorados pelo Google. | `lastmod` = `updatedAt` da Shopify (produtos/coleções) em `app/sitemap.ts`. |

## 2. SEO on-page e dados estruturados

| # | Sev. | Problema | Onde | Correção |
|---|---|---|---|---|
| S1 | P1 | **Soft-404**: `/produtos/<inexistente>`, `/categorias/<inexistente>` e `/colecoes/<inexistente>` respondem **200** (com noindex). Causa: os `loading.tsx` começam o streaming antes do `notFound()`. | `app/produtos/loading.tsx`, `app/categorias/[handle]/loading.tsx`, `app/colecoes/[handle]/loading.tsx` | Apagar os `loading.tsx` (as páginas são ISR, o skeleton quase não aparece). Resolve também S2 e S3. |
| S2 | P1 | Redirect `/colecoes/velas-de-copo` → `/categorias/...` é **meta-refresh com 200**, não 301. | `app/colecoes/[handle]/page.tsx:46` | Mover para `redirects()` em `next.config.ts` (`permanent: true`). |
| S3 | P1 | **Dois `<h1>`** em `/produtos` e em todas as páginas de produto (o `<h1>Loja</h1>` do `loading.tsx` fica no HTML). | `app/produtos/loading.tsx:6` | Vai com S1. |
| S4 | P1 | **Canonical da home herdado**: `/pesquisa`, `/carrinho`, 404s têm `canonical = https://playfulcandles.com`. | `app/layout.tsx:35` | Tirar `alternates` do layout raiz; pôr `canonical: '/'` só em `app/page.tsx`. |
| S5 | P1 | **OG/Twitter iguais em quase todo o site**: `/faq`, `/categorias/*` partilham `og:title` e `og:url` da home (partilhas no WhatsApp/Instagram mostram a home). Produtos só acertam o título. | `app/layout.tsx` (bloco `openGraph`/`twitter`) | Tirar `title`/`description`/`url` do OG raiz; o Next preenche a partir de cada página. |
| S6 | P1 | JSON-LD Product: `shippingDetails` e `hasMerchantReturnPolicy` só para **PT** (a loja envia para ES); sem `shippingRate`; `sku` = GID da Shopify; `brand` = "PlayfulCandles" (vendor). | `lib/jsonld.ts:59-160` | Um `OfferShippingDetails` por zona (PT, ES) com tarifa; `applicableCountry: ['PT','ES']`; SKU real; `brand: SITE.name`. |
| S7 | P2 | JSON-LD da loja como `Store` (loja física) com morada residencial e `areaServed` só PT. | `lib/jsonld.ts:6-40` | `OnlineStore`, `areaServed: [PT, ES]`. |
| S8 | P2 | Meta description da home com ~184 car. (corta no Google); títulos de produto > 60 car. (`waffles-berries`, `pack-outono`, `pack-starter-wax`, `cotton-flower` — SEO title na Shopify); descrição cortada a meio da palavra (`slice(0,155)`). | `lib/site.ts`, `app/produtos/[handle]/page.tsx:64`, admin | ≤155 car.; cortar no último espaço. |
| S9 | P2 | Lighthouse acusa "sem meta description": o Next 15.5 faz *streaming* dos metadados para o `<body>` em user-agents que não reconhece como bot. O Googlebot recebe no `<head>`, mas outras ferramentas/crawlers de IA podem não. | `next.config.ts` | `htmlLimitedBots` a cobrir todos (ou `/.*/`) para servir metadados sempre no `<head>`. |
| S10 | P2 | Títulos de categoria pobres ("Wax Melts · Playful Candles"). | `lib/categories.ts` | Ex.: "Wax Melts de Cera de Soja feitos em Lisboa". |
| S11 | P2 | 404 emite BreadcrumbList JSON-LD a apontar para `/404`. | `app/not-found.tsx` | Tirar os breadcrumbs da 404. |
| S12 | P2 | "Queimador **Amsterdã**" é pt-BR → "Amesterdão". | admin Shopify (+ redirect do handle) | |
| ok | — | Filtros/ordenação canonicalizam para a URL limpa; sem `hreflang` (correto: ES/EN não têm URLs); `alt` presentes; `aggregateRating` só com avaliações reais. | | |

## 3. PageSpeed / Core Web Vitals

Lighthouse mobile (Moto G, 4G lento): **LCP 10,1 s home · 6,7 s loja · 8,5 s produto**, FCP ~4 s, CLS 0, TBT ≈ 0.
O JS está bem; o problema é **imagens + CSS bloqueante + fontes**.

| # | Sev. | Problema | Onde | Correção |
|---|---|---|---|---|
| P1 | **P1** | **Hero sem prioridade**: `getImageProps` ignora `priority` → o `<img>` sai sem `fetchpriority="high"` e sem preload; o `src` de fallback pede `w=3840&q=90`. | `components/PhotoBanner/PhotoBanner.tsx:29-42` | `fetchPriority="high"` no `<img>` quando `priority`; `ReactDOM.preload()` com `imageSrcSet` + `media` para cada fonte. Considerar q80 no mobile. |
| P2 | **P1** | **Fotos de produto (PDP) servidas originais** (`unoptimized` + JPG original do CDN Shopify, sem `srcset`) → ~400 KB desperdiçados por página; é o LCP da PDP. | `components/ProductGallery/ProductGallery.tsx:118-125, 172` | Manter o JPG (textura), mas pedir tamanho: `?width=` do CDN Shopify num `srcset` 640/960/1280, ou um `loader` próprio. Thumbs a `width=160`. |
| P3 | **P1** | **`logo.png` com 364 KB**, pré-carregado em todas as páginas (e repetido no footer). | `public/images/logo.png` | Exportar SVG ou WebP ~15 KB. |
| P4 | P1 | Na loja, o LCP é o 1.º card com `loading="lazy"`; `sizes` diz 78vw no mobile mas a grelha é de 2 colunas (~46vw). | `components/ProductCard/ProductCard.tsx:33-39` | `priority` nos primeiros 2–4 cards; `sizes` por contexto (grelha vs carrossel). |
| P5 | P1 | **15 ficheiros CSS bloqueantes** (~2,6 s estimados no mobile) + **Font Awesome completo** (CSS + 3 fontes: solid, regular, brands) para meia dúzia de ícones. | `app/layout.tsx:4` | Trocar FA por SVG inline dos ícones usados; `experimental.cssChunking`/`optimizeCss` para juntar CSS. |
| P6 | P2 | 6 fontes pré-carregadas (incl. Genty `.otf`, sem compressão). | `app/fonts.ts` | Converter Genty para woff2 e subset; pré-carregar só as do above-the-fold. |
| P7 | P2 | HTML da home com 253 KB; páginas `no-store` → sem bfcache e `cf-cache-status: DYNAMIC`. | | Rever se a home precisa de ser dinâmica (cookies/headers lidos no layout?) — com ISR a Cloudflare podia servir do edge. |

## 4. Fluxo de compra (testado em produção, mobile)

Home → produto → **Adicionar** (≈3 s até abrir a gaveta) → gaveta → **Finalizar compra** →
checkout Shopify em `checkout.playfulcandles.com` ✅ com MB WAY, Multibanco, cartão, PayPal, Shop Pay, Google Pay.

| # | Sev. | Problema | Correção |
|---|---|---|---|
| F1 | **P0** | **Checkout em inglês** (URL `/en-pt`, "Contact", "Delivery", "Pay now") e emails de encomenda também. Nome da loja aparece "PlayfulCandles" (sem espaço). | Admin → Definições → Idiomas: publicar **Português (Portugal)** e defini-lo como predefinido; corrigir o nome da loja. Opcional: `buyerIdentity.countryCode`/`language` no `cartCreate`. |
| F2 | P1 | Açores e Madeira aparecem na lista de regiões do checkout; o cliente só descobre que não há envio no passo seguinte. | Restringir a zona (ou aviso no carrinho: "Não enviamos para as ilhas"). |
| F3 | P1 | **Erros reais nunca chegam ao cliente**: `mutate` devolve `false` em qualquer não-2xx e descarta `data.error` → "Sem stock suficiente para o pack", "escolhe todos os itens", "X já não está disponível" viram todos o erro genérico. Igual no "Comprar agora". | `components/cart-context.tsx:72` → devolver `{ok, error}` e mostrar `error` no toast; `BuyBox.tsx:119-125`. |
| F4 | P1 | Webhook de packs resolve itens **pelo título** em todo o catálogo: dois produtos com o mesmo nome (ex.: vela e snapbar "Cappuccino") → desconta stock do errado; título renomeado → não desconta nada. | `app/api/webhooks/orders-create/route.ts:43-48,67` → gravar também o variant ID numa propriedade oculta (`_Snapbar 1 id`) e resolver por ela. |
| F5 | P1 | Validação de stock do pack **passa quando a Admin API falha** (`getVariantStock` devolve `{}` → "sem limite"). | `lib/shopify/admin.ts:87-89`, `lib/packs.ts:240` → propagar o erro. |
| F6 | P2 | Packs podem vender acima do stock (a reserva só existe no webhook, depois da compra). | Aceitar e vigiar stock negativo, ou validar no checkout (Function/UI extension). |
| F7 | P2 | `cartCreate` não pede `warnings` → no 1.º artigo e no "Comprar agora" a Shopify corta a quantidade sem aviso. | `lib/shopify/mutations.ts:5-16` → `warnings { code message }`. |
| F8 | P2 | "Comprar agora": envia `quantity` em vez de `safeQuantity`; não fica desativado com stock 0; fica preso em "A adicionar…" ao voltar do checkout (bfcache). | `BuyBox.tsx:105-130` → `safeQuantity`, `maxQuantity > 0`, `pageshow` → reset. |
| F9 | P2 | Código inválido apaga um código válido já aplicado (PATCH envia `[code]`, limpeza envia `[]`). | `cart-context.tsx:123,135-139` → somar aos códigos existentes. |
| F10 | P2 | Mutações concorrentes do carrinho: um só `pending` e respostas fora de ordem podem sobrepor um carrinho mais novo. | `cart-context.tsx:64-89` → contador de pedidos (ignorar respostas antigas). |
| F11 | P2 | Carrinho já pago noutro separador continua a aparecer (só faz fetch no mount). | `refresh()` em `visibilitychange`; limpar em 422 "cart not found". |
| F12 | P2 | `/api/cart` sem limites: `quantity` sem máximo, nº de linhas ilimitado, `attributes` arbitrários em produtos que não são packs (vão parar à encomenda). | `app/api/cart/route.ts:150-163,211` → quantidade ≤ 99, ≤ 10 linhas, atributos só em packs. |
| F13 | P2 | `/carrinho` mostra **ecrã em branco 1–3 s** (a secção de loading está vazia). | `app/carrinho/page.tsx:25` → skeleton com título e linhas. |
| F14 | P2 | A mensagem de oferta / nota do carrinho que a auditoria anterior dava como feita **já não existe no código**. | Repor (`cartNoteUpdate`) se ainda fizer sentido — velas são muito oferecidas. |

**Verificado e OK:** HMAC do webhook com `timingSafeEqual` e idempotência; cookie do carrinho httpOnly + `sameSite=lax`;
sem open redirects (o `checkoutUrl` vem sempre da Shopify); pesquisa sanitizada; revalidate com segredo;
focus trap e Escape na gaveta.

## 5. Design de conversão (CRO)

| # | Sev. | Observação | Sugestão |
|---|---|---|---|
| C1 | P1 | **Banner de cookies ocupa ~1/3 do ecrã mobile** à chegada, por cima do hero. | Barra compacta de 2 linhas (texto curto + "Aceitar"/"Só essenciais"), "Personalizar" como link. |
| C2 | P1 | **PDP mobile: preço e botão ficam abaixo da dobra** (breadcrumb + título + foto quadrada ocupam o ecrã). | Preço junto ao título; barra fixa "Adicionar · 13,00 €" ao fazer scroll. |
| C3 | P1 | **Nada sobre portes/entrega junto ao botão** de compra, nem na gaveta (só "Total"). O cliente só vê o custo no checkout — principal causa de abandono. | Linha sob o CTA: "Envio em 24h úteis · portes desde X € · ver custos"; na gaveta: "Portes calculados no checkout (PT desde X €)". |
| C4 | P1 | **Estrelas vazias (☆☆☆☆☆) e "Ainda sem avaliações"** em todas as PDPs = prova social negativa. A ficha Google tem 2 avaliações de 5★. | Esconder as estrelas quando há 0 avaliações; mostrar o selo Google 5★ e depoimentos reais do Instagram/WhatsApp; pedir avaliação pós-compra (email Shopify). |
| C5 | P1 | **Packs não mostram a poupança**: Pack Snapbar 13,50 € vs 3 × 5 € = 15 €. | "Poupas 1,50 €" / preço riscado no card e na PDP. |
| C6 | P2 | "Best-Sellers" na home é uma mistura de packs e queimadores — não parece ordenado por vendas reais. | Ordenar por `BEST_SELLING` ou renomear para "Favoritos da casa". |
| C7 | P2 | Gaveta do carrinho com muito espaço vazio e sem cross-sell. | 2–3 sugestões ("Leva também um queimador") — o motor já existe na PDP ("Compra também"). |
| C8 | P2 | Adicionar ao carrinho demora ~3 s sem feedback otimista. | Abrir a gaveta logo com a linha em loading. |
| C9 | P2 | Na categoria Packs (mobile) a foto do topo ocupa o ecrã inteiro; os produtos começam abaixo da dobra. | Banner mais baixo no mobile ou produtos primeiro. |
| C10 | P2 | Hero só diz "Mais cor para os teus dias / Ver coleção" — sem proposta de valor concreta. | Juntar um argumento (feito à mão em Lisboa · envio 24h · MB WAY). |
| C11 | P2 | Preços incoerentes no catálogo: Queimador Grécia/Amsterdã a 5 € vs Dubai a 10 €. | Confirmar no admin. |

## 6. AEO / GEO (llms.txt, FAQ, consistência)

| # | Sev. | Problema | Correção |
|---|---|---|---|
| A1 | P1 | `llms.txt` e `llms-full.txt` ligam para **`/sobre`, que dá 404**. | Criar a página "Sobre" (também ajuda E-E-A-T) ou tirar o link. |
| A2 | P1 | **Contradição sobre as ilhas**: `llms-full.txt` diz "Açores/Madeira: sob consulta"; `/envios` diz "Não enviamos". A descrição do Pumpkin Spice (e talvez outras) diz "entrega em todo Portugal". | Alinhar tudo com `/envios`; rever descrições na Shopify. |
| A3 | P2 | `llms.txt` omite a categoria **Packs**; links relativos (o formato llmstxt.org pede `- [Nome](https://…): nota`); não tem preços, portes por zona nem prazos (PT 2–5, ES 2–8 dias úteis). | Reescrever com links absolutos e factos citáveis. |
| A4 | P2 | "Idiomas: Espanhol, Inglês" — ES/EN são só interface no cliente; crawlers só veem PT. | Retirar ou explicar. |
| A5 | P2 | **FAQ curta (6 perguntas)** sem portes, prazos por país, ilhas, devoluções, segurança da chama, alergénios. | Acrescentar perguntas com resposta direta na 1.ª frase ("Quanto custam os portes?", "Entregam nos Açores?", "Quanto demora para Espanha?"). |

## 7. Acessibilidade e conformidade

| # | Sev. | Problema | Onde |
|---|---|---|---|
| L1 | **P1** | **Checkboxes de cookies vêm pré-marcadas** em "Personalizar" (analytics e marketing = `true`) — consentimento inválido (TJUE, Planet49). | `components/CookieConsent/CookieConsent.tsx:50-51,61-62` → `false`. |
| L2 | P2 | Contraste insuficiente: textos das "appeals", título e nomes da `category-nav`. | `Appeals.scss`, `CategoryNav.scss` |
| L3 | P2 | `role` inválido em `<article>` dos carrosséis; `aria-*` proibido na PDP; `h4` no footer sem `h3` antes. | `PagedCarousel`, `Footer.tsx` |
| L4 | P2 | Botões +/− do carrinho com `aria-label="−"`/`"+"` sem nome do produto e quantidade sem `aria-live`. | `components/cart/LineQuantity/LineQuantity.tsx:110-120` |
| L5 | P2 | Metafield de avaliações corrompido → a próxima avaliação **apaga todas**; erro da Admin API devolvido ao browser. | `app/api/reviews/route.ts:99-101,147` |
| L6 | P2 | Favoritos: `JSON.parse` do localStorage sem validar array → um valor estragado rebenta todas as páginas. | `components/wishlist-context.tsx:26,35` |

## 8. Medição (GA4)

- Sem evento `purchase` no código (depende dos Customer Events da Shopify — confirmar no GA4 DebugView com uma compra de teste).
- `add_to_cart` sem `value`; "Leva junto"/banner de pack (`BundleAddButton.tsx:19-22`) sem `add_to_cart`; "Comprar agora" sem `begin_checkout`.

---

## 9. Plano sugerido

1. **Hoje, no admin/infra (sem código):** F1 checkout em PT · I1/I2 www e 301 · F2 ilhas · C11/S12 catálogo.
2. **Lote de código rápido (~½ dia):** S1–S5 (apagar `loading.tsx`, redirect em config, canonical/OG) · L1 cookies · R1 robots · P1/P3/P4 imagens críticas · A1/A2 llms.
3. **Lote de conversão (~1–2 dias):** C1–C5 · F3 erros visíveis · F13 skeleton do carrinho.
4. **Robustez:** F4/F5 packs e webhook · F7–F12 · JSON-LD (S6/S7) · P2/P5/P6 performance.

*Itens de configuração da Shopify e legais continuam detalhados em `manual_required.md`.*
