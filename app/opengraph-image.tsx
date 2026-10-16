import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Playful Candles — Velas artesanais feitas em Lisboa';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const asset = (path: string) => readFile(join(process.cwd(), path));
const dataUrl = async (path: string, mime: string) => `data:${mime};base64,${(await asset(path)).toString('base64')}`;

// Imagem social compartilhada por OG e Twitter (1200×630), gerada no build.
// Esquerda: painel rosa com a logo e o título em Genty; direita: foto das velas.
// Genty não tem acentos, por isso o título em script evita-os.
export default async function OgImage() {
  const [genty, logo, photo] = await Promise.all([
    asset('app/fonts/Genty.otf'),
    dataUrl('public/images/logo.png', 'image/png'),
    dataUrl('public/images/categorias/cat-velas-glow.jpg', 'image/jpeg'),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#ff5ca6' }}>
        <div
          style={{
            width: 600,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 56px 0 64px',
            background: 'linear-gradient(160deg,#ff5ca6 0%,#ff4d7d 100%)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={logo} width={480} height={101} style={{ marginLeft: -8 }} />
          <div
            style={{
              marginTop: 40,
              fontFamily: 'Genty',
              fontSize: 64,
              lineHeight: 1.05,
              color: '#fffbfd',
              textShadow: '4px 4px 0 #f7902f',
            }}
          >
            Velas artesanais feitas em Lisboa
          </div>
          <div style={{ marginTop: 32, fontSize: 26, color: '#fffbfd', opacity: 0.95 }}>
            Cera vegetal · Envio para todo o Portugal
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={photo} width={600} height={630} style={{ objectFit: 'cover' }} />
      </div>
    ),
    { ...size, fonts: [{ name: 'Genty', data: genty, style: 'normal', weight: 400 }] },
  );
}
