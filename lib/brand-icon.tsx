import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// Favicon: o "P" da logo em Genty, creme com sombra laranja (como as letras da logo) sobre rosa.
// Partilhado com o apple-icon (180px, sem cantos: o iOS arredonda sozinho).
export async function brandIcon(px: number, radius: number) {
  const genty = await readFile(join(process.cwd(), 'app/fonts/Genty.otf'));
  const shadow = Math.max(1, Math.round(px / 22));
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ff5ca6',
          borderRadius: radius,
          color: '#fffbfd',
          fontFamily: 'Genty',
          fontSize: px * 0.86,
          lineHeight: 1,
          // A Genty assenta o "P" um pouco alto e à direita: compensa para ficar ao centro ótico.
          paddingTop: px * 0.1,
          paddingRight: px * 0.04,
          textShadow: `${shadow}px ${shadow}px 0 #f7902f`,
        }}
      >
        P
      </div>
    ),
    { width: px, height: px, fonts: [{ name: 'Genty', data: genty, style: 'normal', weight: 400 }] },
  );
}
