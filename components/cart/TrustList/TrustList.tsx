'use client';

import { useT } from '@/components/LanguageProvider';
import './TrustList.scss';

// Ícone de cada selo de confiança. O texto vem de t.product.<chave>.
const ICONS = {
  freeShip: 'fa-truck-fast',
  delivery: 'fa-clock',
  easyReturns: 'fa-rotate-left',
  securePay: 'fa-lock',
} as const;

type TrustItem = keyof typeof ICONS;

// Selos de confiança (frete grátis, pagamento seguro…) mostrados no carrinho.
export default function TrustList({ items, inline = false }: { items: TrustItem[]; inline?: boolean }) {
  const t = useT();
  return (
    <ul className={`trust-list${inline ? ' trust-list--inline' : ''}`}>
      {items.map((item) => (
        <li key={item}>
          <i className={`fa-solid ${ICONS[item]}`} aria-hidden="true" />
          {t.product[item]}
        </li>
      ))}
    </ul>
  );
}
