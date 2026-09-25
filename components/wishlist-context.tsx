'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const KEY = 'pc-wishlist';

type WishlistValue = {
  items: string[]; // handles dos produtos
  count: number;
  ready: boolean;
  has: (handle: string) => boolean;
  toggle: (handle: string) => void;
};

const WishlistContext = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // carrega do localStorage (à prova de modo privado / storage bloqueado)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* storage indisponível */
    }
    setReady(true);
    // sincroniza entre separadores
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        try {
          setItems(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          /* ignora */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignora */
    }
  }, [items, ready]);

  const toggle = useCallback(
    (handle: string) => setItems((prev) => (prev.includes(handle) ? prev.filter((h) => h !== handle) : [handle, ...prev])),
    [],
  );
  const has = useCallback((handle: string) => items.includes(handle), [items]);

  return (
    <WishlistContext.Provider value={{ items, count: items.length, ready, has, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist precisa estar dentro de <WishlistProvider>');
  return ctx;
}
