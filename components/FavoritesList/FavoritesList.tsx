'use client';

import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import { useWishlist } from '@/components/wishlist-context';
import type { Product } from '@/lib/shopify/types';

// Recebe o catálogo inteiro (do servidor) e mostra só os produtos favoritados (localStorage, no cliente).
export default function FavoritesList({ products }: { products: Product[] }) {
  const { items, ready } = useWishlist();
  if (!ready) return null; // evita piscar "sem favoritos" antes de ler o localStorage
  const favorites = items
    .map((handle) => products.find((product) => product.handle === handle))
    .filter(Boolean) as Product[];
  if (favorites.length === 0) {
    return (
      <p className="empty-state">
        Ainda não tens favoritos. Explora a <Link href="/produtos">loja</Link> e carrega no ♥ dos que gostares.
      </p>
    );
  }
  return <ProductGrid products={favorites} listName="Favoritos" />;
}
