import SkeletonGrid from '@/components/SkeletonGrid/SkeletonGrid';

export default function Loading() {
  return (
    <section className="container">
      <SkeletonGrid count={9} />
    </section>
  );
}
