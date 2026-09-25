// GA4 / GTM dataLayer helpers. Events only fire in the browser; GTM decides what to do
// with them (respecting Consent Mode). Purchase is tracked on Shopify's checkout/thank-you.
type DL = { push: (o: Record<string, unknown>) => void };

function dataLayer(): DL | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer || [];
  return w.dataLayer as unknown as DL;
}

export function pushEvent(event: string, data: Record<string, unknown> = {}) {
  dataLayer()?.push({ event, ...data });
}

export type EcommItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
};

// GA4 e-commerce event. Clears the previous `ecommerce` object first (GA4 best practice).
export function ecommerceEvent(
  event: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'view_item_list',
  items: EcommItem[],
  extra: Record<string, unknown> = {},
) {
  const dl = dataLayer();
  if (!dl) return;
  dl.push({ ecommerce: null });
  dl.push({
    event,
    ecommerce: { currency: 'EUR', items, ...extra },
  });
}
