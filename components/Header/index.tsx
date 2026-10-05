'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../cart-context';
import { useWishlist } from '../wishlist-context';
import { useLang } from '../LanguageProvider';
import { LOCALES } from '@/lib/i18n';
import SearchBox from '../SearchBox';
import LanguageDropdown from '../LanguageDropdown';
import { SITE } from '@/lib/site';

type MenuCollection = { handle: string; title: string };

const Header = ({ collections = [] }: { collections?: MenuCollection[] }) => {
  const { cart, openCart } = useCart();
  const { count: wishCount } = useWishlist();
  const { t, locale, setLocale } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = cart?.totalQuantity ?? 0;
  const close = () => {
    setMenuOpen(false);
    if (typeof document !== 'undefined') (document.activeElement as HTMLElement | null)?.blur();
  };

  const pathname = usePathname();

  // Menu mobile (gaveta à esquerda): Esc fecha.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Link ativo (laranja); os restantes ficam rosa.
  const homeActive = pathname === '/';
  const shopActive = /^\/(produtos|categorias|colecoes)/.test(pathname);
  const aboutActive = pathname.startsWith('/sobre');

  return (
    <header className={`hd${menuOpen ? ' nav-open' : ''}`}>
      <div className="wrap hd__in">
        <div className={`mnav__overlay${menuOpen ? ' is-open' : ''}`} onClick={close} aria-hidden="true" />
        <nav className="nav" aria-label="Navegação principal">
          {/* cabeçalho da gaveta (só mobile) */}
          <div className="nav__m-head">
            <strong>Menu</strong>
            <button type="button" onClick={close} aria-label={t.cart.close}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
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
          {/* Só mobile: o que sai do header (favoritos · conta · idioma) */}
          <div className="nav__m-extra">
            <Link href="/favoritos" onClick={close}>
              <i className="fa-regular fa-heart" aria-hidden="true" /> Favoritos{wishCount > 0 && ` (${wishCount})`}
            </Link>
            <a href={SITE.accountUrl}>
              <i className="fa-regular fa-user" aria-hidden="true" /> {t.header.account}
            </a>
            <div className="nav__m-lang" role="group" aria-label={t.lang.label}>
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  aria-pressed={l.code === locale}
                  className={l.code === locale ? 'is-active' : undefined}
                  onClick={() => setLocale(l.code)}
                >
                  <span className={`fi fi-${l.country}`} aria-hidden="true" /> {l.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <button
          type="button"
          className="burger"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          ☰
        </button>

        <Link href="/" className="brand-logo" aria-label={t.header.home} title={t.header.home} onClick={close}>
          <Image src="/images/logo.png" alt="Playful Candles" title="Playful Candles" width={1615} height={341} sizes="200px" priority />
        </Link>

        {/* Ícones (foto): idioma · favoritos · pesquisa · conta · carrinho */}
        <div className="hd__tools">
          <div className="hd__d-only"><LanguageDropdown /></div>
          <Link href="/favoritos" className="hd-icon cart-btn hd__d-only" aria-label="Favoritos" title="Favoritos" onClick={close}>
            <i className="fa-regular fa-heart" aria-hidden="true" />
            {wishCount > 0 && <span className="cart-count" aria-hidden="true">{wishCount}</span>}
          </Link>
          <SearchBox />
          <a href={SITE.accountUrl} className="hd-icon hd__d-only" aria-label={t.header.account} title={t.header.account}>
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
