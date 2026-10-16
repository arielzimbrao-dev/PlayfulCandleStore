// Helpers do dataLayer do GA4 / GTM. Os eventos só disparam no navegador; o GTM decide o que
// fazer com eles (respeitando o Consent Mode). A compra é rastreada no checkout/página de
// obrigado da Shopify.
type DataLayer = { push: (entry: Record<string, unknown>) => void };

function dataLayer(): DataLayer | null {
  if (typeof window === 'undefined') return null;
  const globalWindow = window as unknown as { dataLayer?: Record<string, unknown>[] };
  globalWindow.dataLayer = globalWindow.dataLayer || [];
  return globalWindow.dataLayer as unknown as DataLayer;
}

// O gtag.js (GA4 direto) não lê objetos `{ event }` do dataLayer, só chamadas gtag(): reenvia.
function gtagEvent(event: string, params: Record<string, unknown>) {
  (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.('event', event, params);
}

export function pushEvent(event: string, data: Record<string, unknown> = {}) {
  dataLayer()?.push({ event, ...data });
  if (typeof window !== 'undefined') gtagEvent(event, data);
}

export type EcommerceItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
};

// Evento de e-commerce do GA4. Limpa antes o objeto `ecommerce` anterior (boa prática do GA4),
// senão os itens do evento anterior vazam para este.
export function ecommerceEvent(
  event: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'view_item_list',
  items: EcommerceItem[],
  extra: Record<string, unknown> = {},
) {
  const layer = dataLayer();
  if (!layer) return;
  layer.push({ ecommerce: null });
  const ecommerce = { currency: 'EUR', items, ...extra };
  layer.push({ event, ecommerce });
  gtagEvent(event, ecommerce);
}
