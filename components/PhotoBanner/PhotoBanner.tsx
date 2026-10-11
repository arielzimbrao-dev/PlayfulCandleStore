import Link from 'next/link';
import { getImageProps } from 'next/image';
import type { ReactNode } from 'react';
import './PhotoBanner.scss';

// Banner de foto em largura total com "art direction": uma foto para desktop (≥761px) e outra
// para celular, com o texto em HTML por cima (os children: título .photo-banner__title,
// parágrafo .photo-banner__lead, botão…).
// As fotos não têm texto: no desktop deixam livre o terço esquerdo, no celular o topo.
export default function PhotoBanner({
  desktop,
  mobile,
  alt,
  href,
  priority = false,
  textRight = false,
  children,
}: {
  desktop: string;
  mobile: string;
  alt: string;
  /** Deixa a foto clicável (duplica o CTA do texto, por isso fica escondida do teclado e de leitores de tela). */
  href?: string;
  priority?: boolean;
  /** Texto do lado direito (desktop), para fotos com o produto à esquerda. */
  textRight?: boolean;
  children?: ReactNode;
}) {
  const sharedProps = { alt, sizes: '100vw', quality: 90, priority };
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...sharedProps, src: desktop, width: 2048, height: 878 });
  const {
    props: { srcSet: mobileSrcSet, ...mobileImageProps },
  } = getImageProps({ ...sharedProps, src: mobile, width: 1080, height: 1350 });

  const picture = (
    <picture className="photo-banner__picture">
      <source media="(min-width: 761px)" srcSet={desktopSrcSet} />
      <source srcSet={mobileSrcSet} />
      <img {...mobileImageProps} alt={alt} className="photo-banner__image" />
    </picture>
  );

  return (
    <div className={`photo-banner${textRight ? ' photo-banner--text-right' : ''}`}>
      {href ? (
        <Link href={href} className="photo-banner__link" aria-hidden="true" tabIndex={-1}>
          {picture}
        </Link>
      ) : (
        picture
      )}
      {children && <div className="photo-banner__content">{children}</div>}
    </div>
  );
}
