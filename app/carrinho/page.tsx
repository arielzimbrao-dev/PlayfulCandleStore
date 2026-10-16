import { getShippingZones } from '@/lib/shopify/admin';
import { shippingFrom } from '@/components/ShippingNote/ShippingNote';
import CartPageView from './CartPageView';

// Servidor: lê os portes da Shopify; o carrinho em si é client (CartPageView).
export default async function CarrinhoPage() {
  return <CartPageView shippingFrom={shippingFrom(await getShippingZones())} />;
}
