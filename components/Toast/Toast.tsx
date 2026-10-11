'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import './Toast.scss';

type ToastType = 'success' | 'error';
type ToastMessage = { id: number; text: string; type: ToastType };
type ToastContextValue = { show: (text: string, type?: ToastType) => void };

const TOAST_DURATION_MS = 3200;

const ToastContext = createContext<ToastContextValue | null>(null);

// Avisos curtos no rodapé da tela ("Adicionado ao carrinho", erros…).
// Uso: const toast = useToast(); toast.show('Texto', 'error');
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, text, type }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
            <i
              className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}
              aria-hidden="true"
            />{' '}
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return context;
}
