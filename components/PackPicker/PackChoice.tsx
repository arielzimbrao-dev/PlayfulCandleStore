'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type PackChoice = [Record<string, string>, (key: string, handle: string) => void];

// Escolha dos itens do pack (item → handle), partilhada entre a BuyBox (que escolhe) e o
// acordeão de aromas/cuidados (que mostra o escolhido). O provider envolve a coluna do produto.
const PackChoiceContext = createContext<PackChoice | null>(null);

export function PackChoiceProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<Record<string, string>>({});
  return (
    <PackChoiceContext.Provider
      value={[choice, (key, handle) => setChoice((current) => ({ ...current, [key]: handle }))]}
    >
      {children}
    </PackChoiceContext.Provider>
  );
}

export function usePackChoice(): PackChoice {
  const context = useContext(PackChoiceContext);
  if (!context) throw new Error('usePackChoice precisa do PackChoiceProvider');
  return context;
}
