import type { Money } from './shopify/types';

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: money.currencyCode,
  }).format(Number(money.amount));
}
