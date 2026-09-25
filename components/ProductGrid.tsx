import ProductCardBig from './ProductCardBig';
import TrackListView from './TrackListView';
import type { Product } from '@/lib/shopify/types';

export default function ProductGrid({ products, listName }: { products: Product[]; listName?: string }) {
  if (products.length === 0) return <p>Nenhum produto encontrado.</p>;
  return (
    <>
      <TrackListView
        listName={listName}
        items={products.map((p) => ({
          item_id: p.id,
          item_name: p.title,
          price: Number(p.priceRange.minVariantPrice.amount),
          item_category: p.productType,
        }))}
      />
      <div className="product-grid" role="list">
        {products.map((product) => (
          <ProductCardBig key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
