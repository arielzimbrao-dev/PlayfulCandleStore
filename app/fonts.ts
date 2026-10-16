import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';

// Fontes do Figma: Genty (Demo) nos títulos de seção, Poppins em todo o resto (UI/corpo).
// Genty.woff2: subset Latin (U+0000-00FF + pontuação/€) do .otf original, 26 KB → 17 KB.
// Pré-carregada: está no hero, no header e no título da PDP (above the fold).
export const genty = localFont({
  src: './fonts/Genty.woff2',
  variable: '--font-genty',
  display: 'swap',
});

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
  // Sem preload: seriam 5 pesos a disputar banda com a imagem do LCP. Os ficheiros saem logo que
  // o CSS chega, com o fallback ajustado (métricas da Poppins) entretanto, sem CLS.
  // ponytail: o next/font não deixa pré-carregar só alguns pesos de uma família.
  preload: false,
});

export const fontVars = `${genty.variable} ${poppins.variable}`;
