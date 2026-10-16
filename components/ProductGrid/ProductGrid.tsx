import ProductCard from '@/components/ProductCard/ProductCard';
import TrackListView from '@/components/TrackListView/TrackListView';
import type { Product } from '@/lib/shopify/types';
import './ProductGrid.scss';

const GRID_SIZES = '(max-width:1024px) 50vw, 33vw';

// Grade de cards de produto + evento view_item_list para o analytics.
export default function ProductGrid({ products, listName }: { products: Product[]; listName?: string }) {
  if (products.length === 0) return <p>Nenhum produto encontrado.</p>;
  return (
    <>
      <TrackListView
        listName={listName}
        items={products.map((product) => ({
          item_id: product.id,
          item_name: product.title,
          price: Number(product.priceRange.minVariantPrice.amount),
          item_category: product.productType,
        }))}
      />
      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} sizes={GRID_SIZES} priority={index < 3} />
        ))}
      </div>
    </>
  );
}
