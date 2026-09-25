import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carrinho',
  robots: { index: false, follow: true },
};

export default function CarrinhoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
