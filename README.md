# Playful Candles — Storefront (Next.js headless)

Storefront Next.js (App Router) consumindo a Shopify Storefront API.

## Rodar localmente

```bash
cp .env.local.example .env.local   # preencha os tokens
npm install
npm run dev
```

Abra http://localhost:3000 — a home lista produtos reais da loja.

## Variáveis de ambiente

| Var | Uso |
| --- | --- |
| `SHOPIFY_STORE_DOMAIN` | `playfulcandles.myshopify.com` |
| `SHOPIFY_STOREFRONT_PUBLIC_TOKEN` | token público do canal Headless |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | token privado (server-only); tem prioridade quando presente |

Todas as chamadas à Storefront API acontecem no servidor (Server Components e o
Route Handler `/api/cart`), então nenhum token vai para o client.

## Deploy (Coolify em VPS)

O projeto é publicado como imagem Docker (`Dockerfile` multi-stage, `output: 'standalone'`).

1. **Coolify → New Resource → Application** → escolher este repositório (GitHub App ou repo público) e o branch.
2. **Build Pack:** `Dockerfile` (caminho `/Dockerfile`, base directory `/`).
3. **Ports Exposes:** `3000`.
4. **Domínio:** em *Domains* pôr `https://playfulcandles.com` (o Coolify/Traefik emite o certificado Let's Encrypt).
   O DNS (registo A) do domínio tem de apontar para o IP da VPS.
5. **Environment Variables:** as da tabela acima + as do `.env.local.example`
   (`NEXT_PUBLIC_*`, `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `SHOPIFY_REVALIDATE_SECRET`).
   - Deixar **"Available at Buildtime"** ligado em `SHOPIFY_STORE_DOMAIN`, nos tokens do Storefront e em
     todas as `NEXT_PUBLIC_*`: o `next build` faz prerender das páginas com dados da Shopify e as
     `NEXT_PUBLIC_*` ficam embutidas no JS do browser (mudar uma exige redeploy).
   - `SHOPIFY_CLIENT_*` e `SHOPIFY_REVALIDATE_SECRET` só são precisas em runtime.
6. **Health Check:** caminho `/api/health`, porta `3000` (a imagem também traz `HEALTHCHECK`).
7. **Deploy automático:** ativar *Auto Deploy* (com a GitHub App) ou usar o webhook de deploy do Coolify.
8. **Webhook Shopify (ISR):** apontar `products/update` e `collections/update` para
   `https://playfulcandles.com/api/revalidate` com o header `x-revalidate-secret`.

Notas: correr **uma só instância** — o rate limit das reviews e o cache ISR vivem no container
(o cache recomeça a cada deploy, o que é inofensivo). Testar a imagem localmente:

```bash
docker build -t playfulcandles \
  --build-arg SHOPIFY_STORE_DOMAIN=playfulcandles.myshopify.com \
  --build-arg SHOPIFY_STOREFRONT_PUBLIC_TOKEN=... \
  --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 .
docker run --env-file .env.local -p 3000:3000 playfulcandles
```

## Estrutura

```
app/                      → rotas (App Router)
  page.tsx                → home
  produtos/               → /produtos (loja) e /produtos/[handle] (página de produto)
  categorias/[handle]/    → listagem por categoria (velas, wax melts, snapbars, queimadores)
  colecoes/               → /colecoes e /colecoes/[handle]
  carrinho/ pesquisa/ favoritos/
  faq/ envios/ devolucoes/ contacto/ termos/ privacidade/   → páginas de conteúdo
  api/                    → cart, search, reviews, revalidate (webhook ISR), health
  layout.tsx              → layout raiz (header, footer, gaveta do carrinho, cookies, analytics)
  fonts.ts                → Poppins + Genty via next/font

components/               → uma pasta por componente, com o .tsx e o .scss dele
  Footer/
    Footer.tsx            → importa o próprio estilo: import './Footer.scss'
    Footer.scss
    VipBanner/            → subcomponente usado só pelo Footer fica dentro da pasta dele
  cart/                   → peças partilhadas pela gaveta e pela página do carrinho
  cart-context.tsx, wishlist-context.tsx, LanguageProvider.tsx, useDismiss.ts
                          → contextos e hooks partilhados (não são componentes visuais)

styles/                   → só o que é global
  global.scss             → ponto de entrada (importado no app/layout.tsx)
  _tokens.scss            → cores, fontes, espaços, cantos, sombras, z-index (variáveis CSS)
  _mixins.scss            → breakpoints (@include mobile, tablet…) e mixins
  _base.scss, _shared.scss, _prose.scss → reset, utilitários (.btn, .wrap…) e texto corrido

lib/
  shopify/                → cliente GraphQL, queries, mutations, tipos e Admin API (estoque, promoções)
  filters.ts, sort.ts     → filtros e ordenação das listagens
  bundle.ts               → regras do "Leva junto"
  i18n.ts                 → textos da loja (PT/ES/EN)
  jsonld.ts, site.ts      → SEO (dados estruturados) e dados da empresa
  analytics.ts            → eventos de e-commerce (GA4/GTM)

scripts/                  → scripts pontuais de manutenção da loja via Admin API
                            (preços, estoque, SKUs, fotos, copy dos produtos…)
design/                   → design system (design-system.md), mockup e fontes
public/                   → imagens, ícones e llms.txt
```

Convenções:

- **Estilos:** cada componente tem o seu `.scss` ao lado do `.tsx`. Os estilos globais ficam em
  `@layer`, por isso o CSS de um componente sempre vence um utilitário global. Classes em BEM por
  extenso (`.product-card__name`), medidas em px múltiplos de 8. Detalhes e lista de classes em
  [`design/design-system.md`](design/design-system.md).
- **Código:** nomes autoexplicativos (sem abreviações) e comentários em pt-BR. A copy da loja é pt-PT.
- **Checkout:** redireciona para `cart.checkoutUrl` (checkout hospedado da Shopify). O carrinho guarda o
  `cartId` num cookie httpOnly (`app/api/cart/route.ts`).

## Fora de escopo (próximas fases)

Customer Account API (login no site), webhooks de pedidos, rotas por idioma (`/es`, `/en` + hreflang).
