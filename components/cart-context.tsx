'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useToast } from './Toast';
import { useT } from './LanguageProvider';
import type { Cart } from '@/lib/shopify/types';

type CartContextValue = {
  cart: Cart | null;
  isOpen: boolean;
  loading: boolean;
  /** false até o primeiro GET responder — evita mostrar "carrinho vazio" antes de saber. */
  ready: boolean;
  /** id da linha em atualização (ou 'cart' para ações globais); só essa linha fica bloqueada. */
  pending: string | null;
  openCart: () => void;
  closeCart: () => void;
  addItem: (merchandiseId: string, quantity?: number) => Promise<boolean>;
  updateItem: (lineId: string, quantity: number) => Promise<boolean>;
  removeItem: (lineId: string) => Promise<boolean>;
  applyDiscount: (code: string) => Promise<boolean>;
  saveNote: (note: string) => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const toast = useToast();
  const t = useT();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) return;
      const data = (await res.json()) as { cart: Cart | null };
      setCart(data.cart);
    } catch {
      /* rede indisponível — mantém o estado atual */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = useCallback(async (init: RequestInit, key = 'cart'): Promise<boolean> => {
    setLoading(true);
    setPending(key);
    try {
      const res = await fetch('/api/cart', {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { cart?: Cart | null; error?: string };
      if (data.cart) {
        setCart(data.cart);
        // A Shopify ajusta a quantidade ao stock e avisa em vez de falhar — dizer ao cliente.
        if (data.cart.warnings?.some((w) => w.code.includes('STOCK'))) {
          toast.show(t.cart.stockAdjusted, 'error');
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
      setPending(null);
    }
  }, [toast, t]);

  const addItem = useCallback(
    async (merchandiseId: string, quantity = 1) => {
      const ok = await mutate({ method: 'POST', body: JSON.stringify({ merchandiseId, quantity }) });
      if (ok) setIsOpen(true);
      return ok;
    },
    [mutate],
  );

  const updateItem = useCallback(
    (lineId: string, quantity: number) =>
      mutate({ method: 'PATCH', body: JSON.stringify({ lineId, quantity }) }, lineId),
    [mutate],
  );

  const removeItem = useCallback(
    (lineId: string) => mutate({ method: 'DELETE', body: JSON.stringify({ lineId }) }, lineId),
    [mutate],
  );

  const saveNote = useCallback(
    (note: string) => mutate({ method: 'PATCH', body: JSON.stringify({ note }) }),
    [mutate],
  );

  // Shopify aceita qualquer string e devolve-a com applicable:false (sem userErrors).
  // Só devolvemos sucesso se o código voltar como APLICÁVEL (ou se for uma remoção).
  const applyDiscount = useCallback(async (code: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountCodes: code ? [code] : [] }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { cart?: Cart | null };
      if (!data.cart) return false;
      setCart(data.cart);
      if (!code) return true; // remoção de códigos
      const wanted = code.trim().toLowerCase();
      const ok = (data.cart.discountCodes ?? []).some((dc) => dc.applicable && dc.code.toLowerCase() === wanted);
      // Um código inválido fica agarrado ao carrinho (applicable:false) e volta a aparecer como erro
      // no checkout — limpa-o. A limpeza devolve o carrinho já sem o código.
      if (!ok) {
        const clean = await fetch('/api/cart', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discountCodes: [] }),
        })
          .then((r) => (r.ok ? (r.json() as Promise<{ cart?: Cart | null }>) : null))
          .catch(() => null);
        if (clean?.cart) setCart(clean.cart);
      }
      return ok;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        loading,
        ready,
        pending,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
        applyDiscount,
        saveNote,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>');
  return ctx;
}
