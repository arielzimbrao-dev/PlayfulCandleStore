import SkeletonGrid from '@/components/SkeletonGrid';

export default function Loading() {
  return (
    <section className="container">
      <h1>Loja</h1>
      <SkeletonGrid count={12} />
    </section>
  );
}
