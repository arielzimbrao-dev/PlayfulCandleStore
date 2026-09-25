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

- `lib/shopify/` — cliente GraphQL, queries, mutations, tipos e funções de alto nível.
- `app/api/cart/route.ts` — carrinho; `cartId` em cookie httpOnly (GET/POST/PATCH/DELETE).
- `components/` — grid de produtos, botão de adicionar, drawer e contexto do carrinho.
- Checkout: redireciona para `cart.checkoutUrl` (checkout hospedado da Shopify).

## Fora de escopo (próximas fases)

Customização visual, Customer Account API (login), webhooks de pedidos.
