'use client';

import { useT } from '@/components/LanguageProvider';
import { SITE } from '@/lib/site';
import './VipBanner.scss';

// Convite para o grupo Playful VIP no WhatsApp (a loja não tem newsletter por e-mail).
// Fica no topo do footer e usa o mesmo fundo dele.
export default function VipBanner() {
  const t = useT();

  return (
    <section className="vip" aria-labelledby="vip-title">
      <div className="wrap vip__inner">
        <div className="vip__content">
          <p className="eyebrow vip__eyebrow">Playful VIP</p>
          <h2 id="vip-title">{t.news.title}</h2>
          <p>{t.news.text}</p>
          <a className="btn vip__cta" href={SITE.vipGroup} target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-whatsapp" aria-hidden="true" /> {t.news.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
