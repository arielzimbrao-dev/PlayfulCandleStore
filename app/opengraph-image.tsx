import { ImageResponse } from 'next/og';

export const alt = 'Playful Candles — Velas artesanais feitas em Lisboa';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Imagem social partilhada por OG e Twitter (rácio 1200×630).
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#ff5ca6,#f88e2f)',
          color: '#fff',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -2 }}>Playful Candles</div>
        <div style={{ fontSize: 40, marginTop: 24, fontWeight: 600, opacity: 0.95 }}>
          Velas artesanais feitas à mão em Lisboa 🕯️
        </div>
        <div style={{ fontSize: 28, marginTop: 32, opacity: 0.9 }}>
          Portes grátis acima de €35 · Entrega em 24/72h
        </div>
      </div>
    ),
    size,
  );
}
