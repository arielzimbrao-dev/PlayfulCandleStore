import { Fragment } from 'react';
import ProductCardBig from './ProductCardBig';
import BundleAddButton from './BundleAddButton';
import { getBundle } from '@/lib/bundle';
import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/shopify/types';
import TwoTone from '@/components/TwoTone';

// Secção "Leva junto" da PDP: produto atual + par(es) = preço do conjunto. Regras em lib/bundle.
export default async function LevaJuntoBundle({ product }: { product: Product }) {
  const bundle = await getBundle(product).catch(() => null);
  if (!bundle) return null;
  const currency = bundle.items[0].variant.price.currencyCode;
  const money = (n: number) => formatMoney({ amount: n.toFixed(2), currencyCode: currency });

  return (
    <section className="sec bundle" aria-labelledby="bundle-h">
      <div className="wrap">
        <div className="sec__head">
          <h2 id="bundle-h" className="script-title"><TwoTone text="Leva junto" /> <span className="script-spark" aria-hidden="true" /></h2>
        </div>
        <div className="bundle__row">
          <div className="bundle__items" role="list">
            {bundle.items.map((i, n) => (
              <Fragment key={i.product.id}>
                {n > 0 && <span className="bundle__op" aria-hidden="true">+</span>}
                <ProductCardBig product={i.product} />
              </Fragment>
            ))}
          </div>
          <span className="bundle__op" aria-hidden="true">=</span>
          <div className="bundle__total">
            {bundle.promo && <span className="bundle__promo">{bundle.promo}</span>}
            {bundle.total < bundle.original && <span className="price-old">{money(bundle.original)}</span>}
            <span className="bundle__price">{money(bundle.total)}</span>
            <small>{bundle.items.length === 2 ? 'pelos dois' : `pelos ${bundle.items.length}`}</small>
            <BundleAddButton
              variantIds={bundle.items.map((i) => i.variant.id)}
              label={bundle.items.length === 2 ? 'Adicionar os dois' : 'Adicionar todos'}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
