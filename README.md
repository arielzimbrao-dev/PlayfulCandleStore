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

## Estrutura

- `lib/shopify/` — cliente GraphQL, queries, mutations, tipos e funções de alto nível.
- `app/api/cart/route.ts` — carrinho; `cartId` em cookie httpOnly (GET/POST/PATCH/DELETE).
- `components/` — grid de produtos, botão de adicionar, drawer e contexto do carrinho.
- Checkout: redireciona para `cart.checkoutUrl` (checkout hospedado da Shopify).

## Fora de escopo (próximas fases)

Customização visual, Customer Account API (login), webhooks de pedidos.
