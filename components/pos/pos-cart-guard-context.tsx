'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type PosCartGuardContextValue = {
  posCartHasItems: boolean;
  setPosCartHasItems: (v: boolean) => void;
};

const PosCartGuardContext = createContext<PosCartGuardContextValue | null>(null);

export function PosCartGuardProvider({ children }: { children: ReactNode }) {
  const [posCartHasItems, setPosCartHasItemsState] = useState(false);
  const setPosCartHasItems = useCallback((v: boolean) => {
    setPosCartHasItemsState(v);
  }, []);

  const value = useMemo(
    () => ({ posCartHasItems, setPosCartHasItems }),
    [posCartHasItems, setPosCartHasItems]
  );

  return (
    <PosCartGuardContext.Provider value={value}>{children}</PosCartGuardContext.Provider>
  );
}

export function usePosCartGuard(): PosCartGuardContextValue {
  const ctx = useContext(PosCartGuardContext);
  if (ctx) return ctx;
  return {
    posCartHasItems: false,
    setPosCartHasItems: () => {
      // No-op fallback for non-POS pages that reuse `PosLayoutHeader`.
    },
  };
}
