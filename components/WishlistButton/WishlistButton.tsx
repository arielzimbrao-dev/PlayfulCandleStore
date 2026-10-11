'use client';

import { useWishlist } from '@/components/wishlist-context';
import './WishlistButton.scss';

// Coração de favoritos.
// variant "card": canto inferior direito da foto do card · "gallery": canto superior direito da galeria (PDP).
export default function WishlistButton({
  handle,
  title,
  variant,
}: {
  handle: string;
  title: string;
  variant: 'card' | 'gallery';
}) {
  const { has, toggle, ready } = useWishlist();
  const isFavorite = ready && has(handle);
  return (
    <button
      type="button"
      className={`wish-button wish-button--${variant}${isFavorite ? ' is-active' : ''}`}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remover ${title} dos favoritos` : `Adicionar ${title} aos favoritos`}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      onClick={(event) => {
        // O botão fica dentro de um link (card): não navegar ao clicar no coração.
        event.preventDefault();
        event.stopPropagation();
        toggle(handle);
      }}
    >
      <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart`} aria-hidden="true" />
    </button>
  );
}
