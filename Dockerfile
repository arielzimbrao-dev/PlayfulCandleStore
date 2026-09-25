# syntax=docker/dockerfile:1
# Imagem de produção para o Coolify (VPS). Build multi-stage com output "standalone" do Next.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- dependências ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- build ---
FROM base AS builder
# O Coolify injeta as variáveis marcadas como "Available at Buildtime" como build args.
# NEXT_PUBLIC_* ficam embutidas no bundle do client; as da Shopify são precisas no build
# porque as páginas estáticas/ISR vão buscar produtos à Storefront API durante o `next build`.
ARG SHOPIFY_STORE_DOMAIN
ARG SHOPIFY_STOREFRONT_PUBLIC_TOKEN
ARG SHOPIFY_STOREFRONT_PRIVATE_TOKEN
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GSC_VERIFICATION
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_GOOGLE_ADS_ID
ARG NEXT_PUBLIC_ACCOUNT_URL
ENV SHOPIFY_STORE_DOMAIN=$SHOPIFY_STORE_DOMAIN \
    SHOPIFY_STOREFRONT_PUBLIC_TOKEN=$SHOPIFY_STOREFRONT_PUBLIC_TOKEN \
    SHOPIFY_STOREFRONT_PRIVATE_TOKEN=$SHOPIFY_STOREFRONT_PRIVATE_TOKEN \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GSC_VERIFICATION=$NEXT_PUBLIC_GSC_VERIFICATION \
    NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_GOOGLE_ADS_ID=$NEXT_PUBLIC_GOOGLE_ADS_ID \
    NEXT_PUBLIC_ACCOUNT_URL=$NEXT_PUBLIC_ACCOUNT_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runtime ---
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
# .next tem de pertencer ao nextjs: o cache ISR (revalidate / webhook) é escrito em runtime.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
