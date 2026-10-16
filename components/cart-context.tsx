'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useToast } from '@/components/Toast/Toast';
import { useT } from './LanguageProvider';
import type { Cart } from '@/lib/shopify/types';

/** error = mensagem real da API (stock do pack, itens por escolher…), quando houver. */
export type CartResult = { ok: boolean; error?: string; cart?: Cart };

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
  /** Vários ids = várias linhas de uma vez (ex.: "Leva junto"), cada uma com `quantity`. */
  addItem: (
    merchandiseId: string | string[],
    quantity?: number,
    attributes?: { key: string; value: string }[],
  ) => Promise<CartResult>;
  updateItem: (lineId: string, quantity: number) => Promise<CartResult>;
  removeItem: (lineId: string) => Promise<CartResult>;
  applyDiscount: (code: string) => Promise<boolean>;
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
  // Nº do último pedido que mexe no carrinho: respostas de pedidos mais antigos são ignoradas
  // (senão um clique lento pode sobrepor o carrinho de um clique mais recente).
  const lastRequest = useRef(0);

  const refresh = useCallback(async () => {
    const request = lastRequest.current;
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) return;
      const data = (await res.json()) as { cart: Cart | null };
      // ponytail: só não aplica se uma mutação começou entretanto; uma que já estava a meio
      // pode ainda perder para este GET — o próximo refresh corrige.
      if (request === lastRequest.current) setCart(data.cart);
    } catch {
      /* rede indisponível — mantém o estado atual */
    } finally {
      setReady(true);
    }
  }, []);

  // Volta a ler o carrinho ao regressar ao separador (pode ter sido pago ou mudado noutro).
  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const mutate = useCallback(async (init: RequestInit, key = 'cart'): Promise<CartResult> => {
    const request = ++lastRequest.current;
    setLoading(true);
    setPending(key);
    try {
      const res = await fetch('/api/cart', {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      });
      const data = (await res.json().catch(() => ({}))) as { cart?: Cart | null; error?: string };
      if (!res.ok || !data.cart) {
        // O carrinho já não existe (pago/expirado): limpa-o em vez de mostrar linhas fantasma.
        if (request === lastRequest.current && /sem carrinho|cart does not exist/i.test(data.error ?? '')) {
          setCart(null);
        }
        return { ok: false, error: data.error };
      }
      if (request === lastRequest.current) setCart(data.cart);
      // A Shopify ajusta a quantidade ao estoque e avisa em vez de falhar — avisamos o cliente.
      if (data.cart.warnings?.some((w) => w.code.includes('STOCK'))) {
        toast.show(t.cart.stockAdjusted, 'error');
      }
      return { ok: true, cart: data.cart };
    } catch {
      return { ok: false };
    } finally {
      if (request === lastRequest.current) {
        setLoading(false);
        setPending(null);
      }
    }
  }, [toast, t]);

  const addItem = useCallback(
    async (merchandiseId: string | string[], quantity = 1, attributes?: { key: string; value: string }[]) => {
      // attributes: propriedades da linha (escolhas de um pack).
      const body = Array.isArray(merchandiseId)
        ? { lines: merchandiseId.map((id) => ({ merchandiseId: id, quantity })) }
        : { merchandiseId, quantity, attributes };
      const result = await mutate({ method: 'POST', body: JSON.stringify(body) });
      if (result.ok) setIsOpen(true);
      return result;
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

  // Shopify aceita qualquer string e devolve-a com applicable:false (sem userErrors).
  // Só devolvemos sucesso se o código voltar como APLICÁVEL (ou se for uma remoção).
  // O PATCH substitui a lista inteira, por isso o código novo vai junto com os já aplicados
  // (os dos packs chegam com code '' e o servidor repõe-nos sozinho).
  const applyDiscount = useCallback(
    async (code: string): Promise<boolean> => {
      const kept = (cart?.discountCodes ?? []).filter((dc) => dc.applicable && dc.code).map((dc) => dc.code);
      const setCodes = (discountCodes: string[]) =>
        mutate({ method: 'PATCH', body: JSON.stringify({ discountCodes }) });
      const result = await setCodes(code ? [...kept, code] : []);
      if (!result.cart) return false;
      if (!code) return true; // remoção de códigos
      const wanted = code.trim().toLowerCase();
      const ok = result.cart.discountCodes.some((dc) => dc.applicable && dc.code.toLowerCase() === wanted);
      // Um código inválido fica agarrado ao carrinho (applicable:false) e volta a aparecer como
      // erro no checkout — tira só esse, mantendo os válidos.
      if (!ok) await setCodes(kept);
      return ok;
    },
    [cart, mutate],
  );

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
