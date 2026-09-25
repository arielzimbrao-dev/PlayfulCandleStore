'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from './LanguageProvider';
import { SITE } from '@/lib/site';

const SHOP_HREFS = ['/categorias/velas-de-copo', '/categorias/wax-melts', '/categorias/snapbars', '/categorias/queimadores'];
const HELP_HREFS = ['/envios', '/devolucoes', SITE.accountUrl, '/contacto'];
const ABOUT_HREFS = ['/sobre', '/faq', '/contacto'];

export default function Footer() {
  const t = useT();
  const cols = [
    { h: t.footer.shop, links: t.footer.shopLinks, hrefs: SHOP_HREFS },
    { h: t.footer.help, links: t.footer.helpLinks, hrefs: HELP_HREFS },
    { h: t.footer.about, links: t.footer.aboutLinks, hrefs: ABOUT_HREFS },
  ];
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="ft__grid">
          <div>
            <span className="brand-logo">
              <Image src="/images/logo.png" alt="Playful Candles" title="Playful Candles" width={1615} height={341} sizes="200px" />
            </span>
            <p>{t.footer.tagline}</p>
            <div className="ft__social" style={{ marginTop: '1rem' }}>
              <a href={SITE.social.instagram} aria-label="Instagram" title="Instagram" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-instagram" aria-hidden="true" /></a>
              <a href={SITE.social.tiktok} aria-label="TikTok" title="TikTok" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-tiktok" aria-hidden="true" /></a>
              <a href={SITE.social.pinterest} aria-label="Pinterest" title="Pinterest" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-pinterest" aria-hidden="true" /></a>
            </div>
          </div>
          {cols.map((c) => (
            <nav key={c.h} aria-label={c.h}>
              <h4>{c.h}</h4>
              {c.links.map((l, i) => (
                <Link key={l} href={c.hrefs[i] ?? '/produtos'} title={l}>{l}</Link>
              ))}
            </nav>
          ))}
          <nav aria-label="Links úteis">
            <h4>Links úteis</h4>
            <Link href="/termos">Termos &amp; condições</Link>
            <Link href="/privacidade">Política de privacidade</Link>
            <button type="button" className="ft__cookies" onClick={() => window.dispatchEvent(new Event('pc-open-consent'))}>
              Gerir cookies
            </button>
            <a href="https://www.livroreclamacoes.pt/inicio" target="_blank" rel="noopener noreferrer">Livro de Reclamações</a>
          </nav>
        </div>

        <div className="ft__bot">
          <p className="ft__copy">
            {t.footer.copy} ·<br />
            <a className="ft__shopify" href="https://www.shopify.com" target="_blank" rel="noopener noreferrer">
              Feito com Shopify
            </a>
          </p>
          <div className="ft__pay">
            <span className="ft__pay-label"><i className="fa-solid fa-lock" aria-hidden="true" /> Pagamento 100% seguro</span>
            <span className="ft__pay-methods" aria-hidden="true">
              <i className="fa-brands fa-cc-visa" title="Visa" />
              <i className="fa-brands fa-cc-mastercard" title="Mastercard" />
              <i className="fa-brands fa-cc-paypal" title="PayPal" />
              <span>Multibanco</span>
              <span>MB WAY</span>
            </span>
          </div>
        </div>
        <p className="ft__legal-id">{SITE.legalName} · NIF {SITE.nif} · {SITE.address.postalCode} {SITE.address.addressLocality}</p>
      </div>
    </footer>
  );
}
