import '@/components/ProductGrid/ProductGrid.scss'; // usa a mesma grade dos produtos reais
import './SkeletonGrid.scss';

// Grade de "cards fantasma" piscando enquanto os produtos carregam (loading.tsx).
export default function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" role="status" aria-label="A carregar produtos">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card" />
      ))}
    </div>
  );
}
