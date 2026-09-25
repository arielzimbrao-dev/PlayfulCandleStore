'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../cart-context';
import { useWishlist } from '../wishlist-context';
import { useT } from '../LanguageProvider';
import SearchBox from '../SearchBox';
import LanguageDropdown from '../LanguageDropdown';
import { SITE } from '@/lib/site';

type MenuCollection = { handle: string; title: string };

const Header = ({ collections = [] }: { collections?: MenuCollection[] }) => {
  const { cart, openCart } = useCart();
  const { count: wishCount } = useWishlist();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = cart?.totalQuantity ?? 0;
  const close = () => {
    setMenuOpen(false);
    if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur();
  };

  // Header transparente sobre o banner no topo (páginas de tipo/coleção com hero).
  const pathname = usePathname();
  const [hasHero, setHasHero] = useState(
    pathname.startsWith('/colecoes/') || pathname.startsWith('/categorias/'),
  );
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const present = !!document.querySelector('.chero');
    setHasHero(present);
    if (!present) return;
    const onScroll = () => setAtTop(window.scrollY < 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);
  const transparent = hasHero && atTop && !menuOpen;

  // Link ativo (laranja); os restantes ficam rosa.
  const homeActive = pathname === '/';
  const shopActive = /^\/(produtos|categorias|colecoes)/.test(pathname);
  const aboutActive = pathname.startsWith('/sobre');

  return (
    <header className={`hd${menuOpen ? ' nav-open' : ''}${transparent ? ' hd--top' : ''}`}>
      <div className="wrap hd__in">
        <nav className="nav" aria-label="Navegação principal">
          <Link href="/" className={homeActive ? 'is-active' : undefined} onClick={close}>{t.topnav.home}</Link>
          {/* Loja com dropdown de categorias/coleções (hover/foco) */}
          <div className={`nav__item${shopActive ? ' is-active' : ''}`}>
            <Link href="/produtos" onClick={close}>{t.topnav.shop}</Link>
            <div className="nav__drop">
              <small>{t.menu.categories}</small>
              <Link href="/categorias/velas-de-copo" onClick={close}>{t.nav.velas}</Link>
              <Link href="/categorias/wax-melts" onClick={close}>{t.nav.wax}</Link>
              <Link href="/categorias/snapbars" onClick={close}>{t.nav.snap}</Link>
              <Link href="/categorias/queimadores" onClick={close}>{t.nav.burner}</Link>
              {collections.length > 0 && (
                <>
                  <small>{t.menu.collections}</small>
                  {collections.map((c) => (
                    <Link key={c.handle} href={`/colecoes/${c.handle}`} onClick={close}>{c.title}</Link>
                  ))}
                </>
              )}
              <Link href="/produtos" onClick={close}>{t.menu.allShop} →</Link>
            </div>
          </div>
          <Link href="/sobre" className={aboutActive ? 'is-active' : undefined} onClick={close}>{t.topnav.about}</Link>
          <Link href="/contacto" className="nav__m-only" onClick={close}>{t.topnav.contact}</Link>
        </nav>

        <button
          type="button"
          className="burger"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <Link href="/" className="brand-logo" aria-label={t.header.home} title={t.header.home} onClick={close}>
          <Image src="/images/logo.png" alt="Playful Candles" title="Playful Candles" width={1615} height={341} sizes="200px" priority />
        </Link>

        {/* Ícones (foto): idioma · favoritos · pesquisa · conta · carrinho */}
        <div className="hd__tools">
          <LanguageDropdown />
          <Link href="/favoritos" className="hd-icon cart-btn" aria-label="Favoritos" title="Favoritos" onClick={close}>
            <i className="fa-regular fa-heart" aria-hidden="true" />
            {wishCount > 0 && <span className="cart-count" aria-hidden="true">{wishCount}</span>}
          </Link>
          <SearchBox />
          <a href={SITE.accountUrl} className="hd-icon" aria-label={t.header.account} title={t.header.account}>
            <i className="fa-regular fa-user" aria-hidden="true" />
          </a>
          <button
            onClick={openCart}
            className="hd-icon cart-btn"
            aria-label={`${t.header.cart}, ${count} ${t.header.items}`}
            title={t.header.cart}
          >
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
            {count > 0 && <span className="cart-count" aria-hidden="true">{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
