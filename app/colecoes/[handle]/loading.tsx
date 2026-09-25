import SkeletonGrid from '@/components/SkeletonGrid';

export default function Loading() {
  return (
    <section className="container">
      <SkeletonGrid count={9} />
    </section>
  );
}
