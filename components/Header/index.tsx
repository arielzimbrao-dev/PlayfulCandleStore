'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../cart-context';
import { useWishlist } from '../wishlist-context';
import { useT } from '../LanguageProvider';
import SearchBox from '../SearchBox';
import AccountMenu from './AccountMenu';
import { SITE } from '@/lib/site';

const MENU = [
  ['/categorias/velas-de-copo', 'velas'],
  ['/categorias/wax-melts', 'wax'],
  ['/categorias/snapbars', 'snap'],
  ['/categorias/queimadores', 'burner'],
] as const;

// Desktop: logo · menu (centro) · pesquisa, favoritos, conta, carrinho.
// Mobile: burger · logo · pesquisa, carrinho — o menu abre numa gaveta à esquerda.
export default function Header({ autumn = 'colecao-de-outono' }: { autumn?: string }) {
  const { cart, openCart } = useCart();
  const { count: wishCount } = useWishlist();
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const count = cart?.totalQuantity ?? 0;
  const autumnHref = `/colecoes/${autumn}`;
  const close = () => setOpen(false);

  // gaveta: fecha com Esc e ao mudar de página
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const active = (href: string) => (pathname.startsWith(href) ? ' is-active' : '');

  return (
    <header className={`hd${open ? ' is-open' : ''}`}>
      <div className="wrap hd__in">
        <button type="button" className="hd__icon hd__burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>

        <Link href="/" className="hd__logo" aria-label={t.header.home}>
          <Image src="/images/logo.png" alt="Playful Candles" width={1615} height={341} unoptimized priority />
        </Link>

        <nav className="hd__nav" aria-label="Navegação principal">
          <div className="hd__drawer-head">
            <strong>Menu</strong>
            <button type="button" className="hd__icon" onClick={close} aria-label={t.cart.close}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>

          <ul className="hd__menu">
            {MENU.map(([href, key]) => (
              <li key={href}><Link href={href} className={`hd__link${active(href)}`}>{t.nav[key]}</Link></li>
            ))}
            <li>
              <Link href={autumnHref} className={`hd__link${active(autumnHref)}`}>
                <span aria-hidden="true">🍂</span> {t.nav.autumn}
              </Link>
            </li>
          </ul>

          {/* só na gaveta: o que no desktop está nos ícones + contacto */}
          <div className="hd__drawer-extra">
            <Link href="/contacto">{t.topnav.contact}</Link>
            <Link href="/favoritos">
              <i className="fa-regular fa-heart" aria-hidden="true" /> Favoritos{wishCount > 0 && ` (${wishCount})`}
            </Link>
            <a href={SITE.accountUrl}>
              <i className="fa-regular fa-user" aria-hidden="true" /> {t.header.account}
            </a>
          </div>
        </nav>
        <div className="hd__overlay" onClick={close} aria-hidden="true" />

        <div className="hd__tools">
          <SearchBox />
          <Link href="/favoritos" className="hd__icon hd__desk" aria-label="Favoritos" title="Favoritos">
            <i className="fa-regular fa-heart" aria-hidden="true" />
            {wishCount > 0 && <span className="hd__count" aria-hidden="true">{wishCount}</span>}
          </Link>
          <AccountMenu />
          <button
            type="button"
            className="hd__icon"
            onClick={openCart}
            aria-label={`${t.header.cart}, ${count} ${t.header.items}`}
            title={t.header.cart}
          >
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
            {count > 0 && <span className="hd__count" aria-hidden="true">{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
