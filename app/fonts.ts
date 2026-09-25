import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';

// Fontes do Figma: Genty (Demo) nos títulos de secção, Poppins em todo o resto (UI/corpo).
export const genty = localFont({
  src: './fonts/Genty.otf',
  variable: '--font-genty',
  display: 'swap',
});

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const fontVars = `${genty.variable} ${poppins.variable}`;
