import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { formatMoney } from '@/lib/format';
import { getShippingZones, type ShippingRate } from '@/lib/shopify/admin';

export const metadata: Metadata = {
  title: 'Envios & portes',
  description: 'Expedição em até 24 horas úteis para Portugal continental e Espanha peninsular. Vê prazos e custos de envio.',
  alternates: { canonical: '/envios' },
};

const kg = (value: number) => `${value.toLocaleString('pt-PT', { maximumFractionDigits: 2 })} kg`;

const eur = (value: number) => formatMoney({ amount: String(value), currencyCode: 'EUR' });

// Resume a tabela da Shopify pelo 1.º escalão: 0–1 kg a €5 → "5,00 € por cada 1 kg"
// (os escalões seguintes na Shopify são múltiplos dele).
function rateLabel([first]: ShippingRate[]) {
  if (!first) return null;
  return first.maxKg ? `${eur(first.price)} por cada ${kg(first.maxKg)}` : eur(first.price);
}

export default async function EnviosPage() {
  const zones = await getShippingZones();
  return (
    <article className="container prose">
      <Breadcrumbs items={[{ name: 'Início', url: '/' }, { name: 'Envios & portes', url: '/envios' }]} />
      <h1>Envios &amp; portes</h1>
      <p className="lead">Embalamos cada encomenda à mão para as velas chegarem inteiras.</p>

      <h2>Onde entregamos</h2>
      <p>Enviamos para <strong>Portugal continental</strong> e <strong>Espanha peninsular</strong>. Não enviamos para os Açores, Madeira, Baleares, Canárias, Ceuta nem Melilla.</p>

      <h2>Prazos de entrega</h2>
      <ul>
        <li>Preparação e expedição: <strong>até 24 horas em dias úteis</strong>. Encomendas feitas ao fim de semana ou em feriados seguem no dia útil seguinte.</li>
        {zones
          .filter((zone) => zone.days)
          .map((zone) => (
            <li key={zone.name}>
              {zone.name}: entrega em <strong>{zone.days!.min} a {zone.days!.max} dias úteis</strong>
            </li>
          ))}
      </ul>

      <h2>Custos de envio</h2>
      <p>Os portes dependem do <strong>peso total da encomenda</strong> e aparecem no checkout, antes de pagares.</p>
      {zones.length ? (
        <ul>
          {zones.map((zone) => (
            <li key={zone.name}>
              {zone.name}: <strong>{rateLabel(zone.rates)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>O valor exato aparece no checkout, antes de pagares.</p>
      )}

      <h2>Seguimento</h2>
      <p>Recebes o número de seguimento por email assim que a encomenda for expedida.</p>
    </article>
  );
}
