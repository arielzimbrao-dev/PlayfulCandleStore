'use client';

import { useId } from 'react';

// Fundo groovy — líquido marmoreado (rios a fluir + brilho + desfoque), aproximação em SVG do mockup.
// tone='default' (base magenta/rosa) ou 'orange' (base laranja com fitas rosa, p/ Coleção Outono como no Figma).
const PALETTES = {
  default: { base: '#ec0f88', shadow: '#b60a66', r1: '#ff7000', h1: '#ffb52e', r2: '#ff7d05', h2: '#ffa62b', mid: '#ff3d97', glow: '#ff5ca6' },
  orange: { base: '#ff7a1f', shadow: '#d24e00', r1: '#ff5ca6', h1: '#ffd27a', r2: '#ec0f88', h2: '#ff9a3d', mid: '#ffc94b', glow: '#ff9a3d' },
} as const;

export default function GroovyBg({ className = '', tone = 'default' }: { className?: string; tone?: keyof typeof PALETTES }) {
  // id estável (igual no servidor e no cliente) para não colidir entre instâncias nem quebrar a hidratação
  const id = useId().replace(/:/g, '');
  const p = PALETTES[tone];
  return (
    <svg
      className={`groovy ${className}`}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id={`${id}b`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <radialGradient id={`${id}g`} cx="80%" cy="14%" r="66%">
          <stop offset="0%" stopColor={p.glow} stopOpacity=".85" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* base */}
      <rect width="1440" height="900" fill={p.base} />

      <g filter={`url(#${id}b)`}>
        {/* sombra profunda — dá contraste */}
        <path fill={p.shadow} d="M-120,300 C240,180 520,440 900,300 C1200,190 1360,420 1620,300 L1620,540 C1360,660 1160,410 900,530 C560,670 260,430 -120,560 Z" />

        {/* rio grosso e ondulante (traço dominante, saturado) */}
        <path fill={p.r1} d="M-120,205 C260,40 520,360 840,215 C1180,60 1320,340 1620,185 L1620,435 C1320,575 1140,300 840,435 C520,580 260,265 -120,415 Z" />
        {/* realce claro na crista */}
        <path fill={p.h1} d="M-120,185 C260,20 520,340 840,195 C1180,40 1320,320 1620,165 L1620,255 C1320,395 1140,135 840,275 C520,410 260,105 -120,255 Z" />

        {/* rio inferior (saturado) */}
        <path fill={p.r2} d="M-120,655 C300,520 540,770 900,635 C1220,510 1380,705 1620,600 L1620,960 L-120,960 Z" />
        {/* realce no fundo */}
        <path fill={p.h2} d="M-120,720 C300,600 560,820 920,700 C1240,590 1400,760 1620,680 L1620,960 L-120,960 Z" />

        {/* ribbon de contraste entre os rios */}
        <path fill={p.mid} d="M-120,470 C280,350 520,610 900,470 C1200,365 1380,565 1620,470 L1620,610 C1380,700 1160,470 900,600 C560,730 260,500 -120,610 Z" />
      </g>

      {/* brilho radial no topo-direito */}
      <rect width="1440" height="900" fill={`url(#${id}g)`} />
    </svg>
  );
}
