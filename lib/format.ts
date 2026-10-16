import type { Money, Product } from './shopify/types';
import type { ShippingRate } from './shopify/admin';

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: money.currencyCode,
  }).format(Number(money.amount));
}

const kg = (value: number) => `${value.toLocaleString('pt-PT', { maximumFractionDigits: 2 })} kg`;
const eur = (value: number) => formatMoney({ amount: String(value), currencyCode: 'EUR' });

// Resume a tabela da Shopify pelo 1.º escalão: 0–1 kg a €5 → "5,00 € por cada 1 kg"
// (os escalões seguintes na Shopify são múltiplos dele).
export function shippingRateLabel([first]: ShippingRate[]) {
  if (!first) return null;
  return first.maxKg ? `${eur(first.price)} por cada ${kg(first.maxKg)}` : eur(first.price);
}

// "Poupas 1,50 €" dos packs (ou "Poupas desde…" quando depende dos itens escolhidos).
export function savingsLabel({ amount, atLeast }: NonNullable<Product['packSavings']>): string {
  return `Poupas ${atLeast ? 'desde ' : ''}${formatMoney({ amount: amount.toFixed(2), currencyCode: 'EUR' })}`;
}
