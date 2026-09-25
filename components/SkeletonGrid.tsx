// Placeholder de grelha durante o carregamento (loading.tsx).
export default function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" role="status" aria-label="A carregar produtos">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton sk-card" />
      ))}
    </div>
  );
}
