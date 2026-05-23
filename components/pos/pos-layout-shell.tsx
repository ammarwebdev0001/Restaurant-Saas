'use client';

import type { ReactNode } from 'react';

import { PosCartGuardProvider } from '@/components/pos/pos-cart-guard-context';
import { PosLayoutHeader } from '@/components/pos/pos-layout-header';
export function PosLayoutShell({ children }: { children: ReactNode }) {
  return (
    <PosCartGuardProvider>
      <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-background">
        <div className="flex min-h-0 flex-1 flex-col p-3 md:p-4">{children}</div>
      </div>
    </PosCartGuardProvider>
  );
}
