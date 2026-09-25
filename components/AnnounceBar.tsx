'use client';

import { useT } from './LanguageProvider';

// Barra de anúncio no topo (PT-PT). Reutiliza a string de portes grátis já localizada.
export default function AnnounceBar() {
  const t = useT();
  return (
    <div className="announce" role="complementary">
      <span aria-hidden="true">✦</span>
      {t.hero.trust[0]}
      <span aria-hidden="true">✦</span>
    </div>
  );
}
