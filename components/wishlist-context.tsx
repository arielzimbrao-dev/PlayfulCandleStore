'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'pc-wishlist';

type WishlistValue = {
  items: string[]; // handles dos produtos
  count: number;
  ready: boolean;
  has: (handle: string) => boolean;
  toggle: (handle: string) => void;
};

const WishlistContext = createContext<WishlistValue | null>(null);

// O valor guardado pode estar estragado (versão antiga, extensão): só aceita uma lista de textos.
function parseItems(raw: string | null): string[] {
  const parsed = raw ? (JSON.parse(raw) as unknown) : [];
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
}

// Favoritos (handles dos produtos) guardados só no navegador, sem conta.
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Carrega do localStorage (à prova de modo privado / armazenamento bloqueado).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setItems(parseItems(raw));
    } catch {
      /* armazenamento indisponível: a lista começa vazia */
    }
    setReady(true);
    // Mantém a lista sincronizada entre abas abertas do site.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        try {
          setItems(parseItems(event.newValue));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
