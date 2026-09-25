'use client';

import Link from 'next/link';
import ProductGrid from './ProductGrid';
import { useWishlist } from './wishlist-context';
import type { Product } from '@/lib/shopify/types';

// Recebe todo o catálogo (server) e mostra só os que estão nos favoritos (localStorage, cliente).
export default function FavoritesList({ products }: { products: Product[] }) {
  const { items, ready } = useWishlist();
  if (!ready) return null; // evita flash antes de ler o localStorage
  const favs = items.map((h) => products.find((p) => p.handle === h)).filter(Boolean) as Product[];
  if (favs.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--ink-soft)', margin: '2.5rem 0' }}>
        Ainda não tens favoritos. Explora a <Link href="/produtos">loja</Link> e carrega no ♥ dos que gostares.
      </p>
    );
  }
  return <ProductGrid products={favs} listName="Favoritos" />;
}
