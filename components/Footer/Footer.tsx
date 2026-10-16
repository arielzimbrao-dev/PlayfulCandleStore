'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/components/LanguageProvider';
import { SITE } from '@/lib/site';
import GoogleRating from '@/components/GoogleRating/GoogleRating';
import VipBanner from '@/components/Footer/VipBanner/VipBanner';
import { OPEN_CONSENT_EVENT } from '@/components/CookieConsent/CookieConsent';
import './Footer.scss';

// Links de cada coluna, na mesma ordem dos textos em t.footer.*Links.
const SHOP_HREFS = ['/categorias/velas-de-copo', '/categorias/wax-melts', '/categorias/snapbars', '/categorias/queimadores'];
const HELP_HREFS = ['/envios', '/devolucoes', SITE.accountUrl, '/contacto'];
const ABOUT_HREFS = ['/faq', '/contacto'];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: SITE.social.instagram, icon: 'fa-instagram' },
  { label: 'TikTok', href: SITE.social.tiktok, icon: 'fa-tiktok' },
  { label: 'Pinterest', href: SITE.social.pinterest, icon: 'fa-pinterest' },
];

// Reabre o banner de cookies (o CookieConsent escuta este evento).
const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));

export default function Footer() {
  const t = useT();
  const columns = [
    { title: t.footer.shop, labels: t.footer.shopLinks, hrefs: SHOP_HREFS },
    { title: t.footer.help, labels: t.footer.helpLinks, hrefs: HELP_HREFS },
    { title: t.footer.about, labels: t.footer.aboutLinks, hrefs: ABOUT_HREFS },
  ];

  return (
    <footer className="footer">
      <VipBanner />
      <div className="wrap footer__inner">
        <div className="footer__grid">
          <div>
            <span className="footer__logo">
              <Image src="/images/logo.webp" alt="Playful Candles" title="Playful Candles" width={682} height={144} unoptimized />
            </span>
            <p>{t.footer.tagline}</p>
            <div className="footer__social">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  title={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className={`fa-brands ${social.icon}`} aria-hidden="true" />
                </a>
              ))}
            </div>
            <GoogleRating />
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3>{column.title}</h3>
              {column.labels.map((label, index) => (
                <Link key={label} href={column.hrefs[index] ?? '/produtos'} title={label}>
                  {label}
                </Link>
              ))}
            </nav>
          ))}

          <nav aria-label="Links úteis">
            <h3>Links úteis</h3>
            <Link href="/termos">Termos &amp; condições</Link>
            <Link href="/privacidade">Política de privacidade</Link>
            <button type="button" className="footer__cookies" onClick={openCookieSettings}>
              Gerir cookies
            </button>
            <a href="https://www.livroreclamacoes.pt/inicio" target="_blank" rel="noopener noreferrer">
              Livro de Reclamações
            </a>
          </nav>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            {t.footer.copy} ·<br />
            <a href="https://www.shopify.com" target="_blank" rel="noopener noreferrer">
              Feito com Shopify
            </a>
          </p>
          <div className="footer__payment">
            <span className="footer__payment-label">
              <i className="fa-solid fa-lock" aria-hidden="true" /> Pagamento 100% seguro
            </span>
            <span className="footer__payment-methods" aria-hidden="true">
              <i className="fa-brands fa-cc-visa" title="Visa" />
              <i className="fa-brands fa-cc-mastercard" title="Mastercard" />
              <i className="fa-brands fa-cc-paypal" title="PayPal" />
              <span>Multibanco</span>
              <span>MB WAY</span>
            </span>
          </div>
        </div>
        <p className="footer__legal-id">
          {SITE.legalName} · NIF {SITE.nif} · {SITE.address.postalCode} {SITE.address.addressLocality}
        </p>
        <p className="footer__credit">
          Desenvolvido por
          <a href="https://agenciapael.pt/pt" target="_blank" rel="noopener noreferrer">
            <Image src="/images/pael-logo.svg" alt="Agência Pael" width={81} height={25} unoptimized />
          </a>
        </p>
      </div>
    </footer>
  );
}
