import { Fragment } from 'react';
import ProductCard from '@/components/ProductCard/ProductCard';
import BundleAddButton from '@/components/BundleOffer/BundleAddButton/BundleAddButton';
import { getBundle } from '@/lib/bundle';
import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/shopify/types';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import './BundleOffer.scss';

// Seção "Leva junto" da PDP: produto atual + par(es) = preço do conjunto.
// As regras de quais produtos combinam ficam em lib/bundle.
export default async function BundleOffer({ product }: { product: Product }) {
  const bundle = await getBundle(product).catch(() => null);
  if (!bundle) return null;
  const currencyCode = bundle.items[0].variant.price.currencyCode;
  const money = (value: number) => formatMoney({ amount: value.toFixed(2), currencyCode });
  const isPair = bundle.items.length === 2;

  return (
    <section className="section bundle" aria-labelledby="bundle-title">
      <div className="wrap">
        <div className="section__head">
          <h2 id="bundle-title" className="script-title">
            <TwoToneTitle text="Leva junto" /> <span className="script-spark" aria-hidden="true" />
          </h2>
        </div>
        <div className="bundle__row">
          {/* display: contents → os cards e os "+" ficam na mesma linha flex que o "=" e o total. */}
          <div className="bundle__items" role="list">
            {bundle.items.map((item, index) => (
              <Fragment key={item.product.id}>
                {index > 0 && (
                  <span className="bundle__operator" aria-hidden="true">
                    +
                  </span>
                )}
                <ProductCard product={item.product} />
              </Fragment>
            ))}
          </div>
          <span className="bundle__operator" aria-hidden="true">
            =
          </span>
          <div className="bundle__total">
            {bundle.promo && <span className="bundle__promo">{bundle.promo}</span>}
            {bundle.total < bundle.original && <span className="price-old">{money(bundle.original)}</span>}
            <span className="bundle__price">{money(bundle.total)}</span>
            <small>{isPair ? 'pelos dois' : `pelos ${bundle.items.length}`}</small>
            <BundleAddButton
              variantIds={bundle.items.map((item) => item.variant.id)}
              label={isPair ? 'Adicionar os dois' : 'Adicionar todos'}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
