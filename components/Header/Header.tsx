'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart-context';
import { useWishlist } from '@/components/wishlist-context';
import { useT } from '@/components/LanguageProvider';
import SearchBox from '@/components/Header/SearchBox/SearchBox';
import AccountMenu from '@/components/Header/AccountMenu/AccountMenu';
import { SITE } from '@/lib/site';
import './Header.scss';

// Itens fixos do menu: [link, chave do texto em t.nav].
const MENU_ITEMS = [
  ['/categorias/velas-de-copo', 'velas'],
  ['/categorias/wax-melts', 'wax'],
  ['/categorias/snapbars', 'snap'],
  ['/categorias/queimadores', 'burner'],
  ['/categorias/packs', 'pack'],
] as const;

// Desktop: logo · menu (centro) · pesquisa, favoritos, conta, carrinho.
// Mobile: burger · logo · pesquisa, carrinho — o menu abre numa gaveta à esquerda.
// `autumnHandle` vem da Shopify (layout) para o link sazonal não quebrar se a coleção mudar de nome.
export default function Header({ autumnHandle = 'colecao-de-outono' }: { autumnHandle?: string }) {
  const { cart, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const t = useT();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const cartCount = cart?.totalQuantity ?? 0;
  const autumnHref = `/colecoes/${autumnHandle}`;
  const closeDrawer = () => setIsDrawerOpen(false);

  // A gaveta fecha ao mudar de página e com a tecla Esc.
  useEffect(() => setIsDrawerOpen(false), [pathname]);
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && closeDrawer();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen]);

  const activeClass = (href: string) => (pathname.startsWith(href) ? ' is-active' : '');

  return (
    <header className={`header${isDrawerOpen ? ' is-open' : ''}`}>
      <div className="wrap header__inner">
        <button
          type="button"
          className="header__icon-button header__burger"
          aria-label="Menu"
          aria-expanded={isDrawerOpen}
          onClick={() => setIsDrawerOpen(true)}
        >
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>

        <Link href="/" className="header__logo" aria-label={t.header.home}>
          <Image src="/images/logo.png" alt="Playful Candles" width={1615} height={341} unoptimized priority />
        </Link>

        <nav className="header__nav" aria-label="Navegação principal">
          <div className="header__drawer-head">
            <span>Menu</span>
            <button type="button" className="header__icon-button" onClick={closeDrawer} aria-label={t.cart.close}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>

          <ul className="header__menu">
            {MENU_ITEMS.map(([href, labelKey]) => (
              <li key={href}>
                <Link href={href} className={`header__link${activeClass(href)}`}>
                  {t.nav[labelKey]}
                </Link>
              </li>
            ))}
            <li>
              <Link href={autumnHref} className={`header__link${activeClass(autumnHref)}`}>
                <span aria-hidden="true">🍂</span> {t.nav.autumn}
              </Link>
            </li>
          </ul>

          {/* Só na gaveta: o que no desktop fica nos ícones, mais o contato. */}
          <div className="header__drawer-extra">
            <Link href="/contacto">{t.topnav.contact}</Link>
            <Link href="/favoritos">
              <i className="fa-regular fa-heart" aria-hidden="true" /> Favoritos
              {wishlistCount > 0 && ` (${wishlistCount})`}
            </Link>
            <a href={SITE.accountUrl}>
              <i className="fa-regular fa-user" aria-hidden="true" /> {t.header.account}
            </a>
          </div>
        </nav>
        <div className="header__overlay" onClick={closeDrawer} aria-hidden="true" />

        <div className="header__tools">
          <SearchBox />
          <Link
            href="/favoritos"
            className="header__icon-button header__desktop-only"
            aria-label="Favoritos"
            title="Favoritos"
          >
            <i className="fa-regular fa-heart" aria-hidden="true" />
            {wishlistCount > 0 && (
              <span className="header__badge" aria-hidden="true">
                {wishlistCount}
              </span>
            )}
          </Link>
          <AccountMenu />
          <button
            type="button"
            className="header__icon-button"
            onClick={openCart}
            aria-label={`${t.header.cart}, ${cartCount} ${t.header.items}`}
            title={t.header.cart}
          >
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="header__badge" aria-hidden="true">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
