'use client';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading: boolean;
  children: ReactNode;
};

export function MenuPageShell({ title, description, loading, children }: Props) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
