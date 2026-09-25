import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Fala com a Playful Candles sobre encomendas, aromas ou parcerias. Estamos na Amadora, Portugal.',
  alternates: { canonical: '/contacto' },
};

export default function ContactoPage() {
  return (
    <article className="container prose">
      <h1>Contacto</h1>
      <p className="lead">Dúvidas sobre encomendas, aromas ou parcerias? Fala connosco.</p>

      <h2>Telefone &amp; WhatsApp</h2>
      <p>
        <a href={`tel:${SITE.telephone}`}>{SITE.telephone}</a> ·{' '}
        <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </p>

      <h2>Email</h2>
      <p><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>

      <h2>Redes sociais</h2>
      <ul>
        <li><a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer">Instagram @theplayfulcandles</a></li>
        <li><a href={SITE.social.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></li>
        <li><a href={SITE.social.pinterest} target="_blank" rel="noopener noreferrer">Pinterest</a></li>
        <li><a href={SITE.social.google} target="_blank" rel="noopener noreferrer">Google Business</a></li>
      </ul>

      <h2>Onde estamos</h2>
      <p>{SITE.address.streetAddress}, {SITE.address.addressLocality}, Portugal.</p>
    </article>
  );
}
