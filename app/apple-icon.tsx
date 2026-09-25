import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#ff5ca6,#f88e2f)',
          color: '#fff',
          fontSize: 120,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        P
      </div>
    ),
    size,
  );
}
