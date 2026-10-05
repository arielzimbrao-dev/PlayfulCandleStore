import Link from 'next/link';
import { getImageProps } from 'next/image';
import type { ReactNode } from 'react';

// Banner foto full-bleed com art direction (desktop ≥761px / mobile) e texto HTML por cima.
// As fotos não têm texto: desktop deixa o terço esquerdo livre, mobile o topo.
export default function PhotoBanner({
  desktop,
  mobile,
  alt,
  href,
  priority = false,
  children,
}: {
  desktop: string;
  mobile: string;
  alt: string;
  /** Torna a foto clicável (duplicado do CTA do texto → escondido de teclado/leitores). */
  href?: string;
  priority?: boolean;
  children?: ReactNode;
}) {
  const common = { alt, sizes: '100vw', quality: 90, priority };
  const { props: { srcSet: dSet } } = getImageProps({ ...common, src: desktop, width: 2048, height: 878 });
  const { props: { srcSet: mSet, ...img } } = getImageProps({ ...common, src: mobile, width: 1080, height: 1350 });

  const pic = (
    <picture className="pban__pic">
      <source media="(min-width: 761px)" srcSet={dSet} />
      <source srcSet={mSet} />
      <img {...img} className="pban__img" />
    </picture>
  );

  return (
    <div className="pban pban--hero">
      {href ? <Link href={href} className="pban__link" aria-hidden="true" tabIndex={-1}>{pic}</Link> : pic}
      {children && <div className="pban__c">{children}</div>}
    </div>
  );
}
