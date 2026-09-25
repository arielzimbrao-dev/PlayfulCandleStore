import type { Metadata } from 'next';
import Script from 'next/script';
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'flag-icons/css/flag-icons.min.css';
import '../styles/global.scss';
import { CartProvider } from '@/components/cart-context';
import { WishlistProvider } from '@/components/wishlist-context';
import { LanguageProvider } from '@/components/LanguageProvider';
import { ToastProvider } from '@/components/Toast';
import Header from '@/components/Header';
import AnnounceBar from '@/components/AnnounceBar';
import ScrollReveal from '@/components/ScrollReveal';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import BackToTop from '@/components/BackToTop';
import JsonLd from '@/components/JsonLd';
import { organizationLd, websiteLd } from '@/lib/jsonld';
import { getCollections } from '@/lib/shopify';
import { NON_COLLECTION_HANDLES } from '@/lib/categories';
import { SITE } from '@/lib/site';
import { fontVars } from './fonts';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'Playful Candles — Velas artesanais feitas em Lisboa',
    template: '%s · Playful Candles',
  },
  description: SITE.description,
  keywords: ['velas artesanais', 'velas aromáticas', 'wax melts Portugal', 'snapbars', 'queimadores', 'velas Lisboa'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    siteName: SITE.name,
    url: SITE.url,
    title: 'Playful Candles — Velas artesanais feitas em Lisboa',
    description: SITE.description,
    // Imagem via convenção app/opengraph-image.tsx (1200×630).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Playful Candles — Velas artesanais',
    description: SITE.description,
    // Imagem via convenção app/opengraph-image.tsx (Next reutiliza-a para o Twitter).
  },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Coleções do menu vindas da Shopify (cacheadas) — antes estava a handle da coleção de outono
  // escrita no código, que dava 404 assim que fosse renomeada.
  const collections = await getCollections(50)
    .then((cs) => cs.filter((c) => !NON_COLLECTION_HANDLES.has(c.handle)).slice(0, 4))
    .catch(() => []);

  return (
    <html lang="pt-PT" className={fontVars}>
      <body>
        {/* Consent Mode v2 — tudo negado por omissão até o visitante aceitar (GDPR) */}
        <Script id="consent-default" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
          gtag('set','url_passthrough',true);
        `}</Script>
        {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
        {!GTM_ID && GA_ID && <GoogleAnalytics gaId={GA_ID} />}

        <JsonLd data={[organizationLd(), websiteLd()]} />

        <a className="visually-hidden" href="#main">Saltar para o conteúdo</a>
        <LanguageProvider>
          <ToastProvider>
            <CartProvider>
              <WishlistProvider>
              <div className="groovy-ribbon" aria-hidden="true" />
              <AnnounceBar />
              <Header collections={collections.map(({ handle, title }) => ({ handle, title }))} />
              <main id="main">{children}</main>
              <Footer />
              <CartDrawer />
              <CookieConsent />
              <BackToTop />
              <ScrollReveal />
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
