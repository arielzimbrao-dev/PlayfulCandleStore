import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import type { ShippingZone } from '@/lib/shopify/admin';
import './ShippingNote.scss';

// Preço do 1.º escalão de Portugal (lido da Shopify em getShippingZones); undefined se a
// Admin API falhar — aí a linha não mostra valor.
export const shippingFrom = (zones: ShippingZone[]) =>
  zones.find((zone) => zone.name.includes('Portugal'))?.rates[0]?.price;

// Linha de portes sob o CTA da PDP e no total do carrinho, com link para /envios.
// cart: no carrinho o prazo já não importa tanto — diz que os portes entram no checkout.
export default function ShippingNote({
  from,
  cart = false,
  onNavigate,
}: {
  from?: number;
  cart?: boolean;
  onNavigate?: () => void;
}) {
  const price = from != null ? formatMoney({ amount: String(from), currencyCode: 'EUR' }) : null;
  return (
    <p className="shipping-note">
      <i className="fa-solid fa-truck-fast" aria-hidden="true" />
      <span>
        {cart
          ? `Portes calculados no checkout${price ? ` (Portugal desde ${price})` : ''}`
          : `Expedição em 24h úteis${price ? ` · portes desde ${price}` : ''}`}
        {' · '}
        <Link href="/envios" onClick={onNavigate}>
          Ver custos
        </Link>
      </span>
    </p>
  );
}
