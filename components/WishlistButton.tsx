'use client';

import { useWishlist } from './wishlist-context';

// Coração de favoritos — usa-se dentro de cards (sobre a imagem) ou na PDP.
export default function WishlistButton({
  handle,
  title,
  className = '',
}: {
  handle: string;
  title: string;
  className?: string;
}) {
  const { has, toggle, ready } = useWishlist();
  const active = ready && has(handle);
  return (
    <button
      type="button"
      className={`wish-btn${active ? ' is-active' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={active}
      aria-label={active ? `Remover ${title} dos favoritos` : `Adicionar ${title} aos favoritos`}
      title={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(handle);
      }}
    >
      <i className={`${active ? 'fa-solid' : 'fa-regular'} fa-heart`} aria-hidden="true" />
    </button>
  );
}
