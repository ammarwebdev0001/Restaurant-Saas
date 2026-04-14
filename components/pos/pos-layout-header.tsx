'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { ModeToggle } from '@/components/darkmode/darkmode';
import UserMenu from '@/components/dashboard/UserMenu';
import { Button } from '@/components/ui/button';

export function PosLayoutHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">POS</h1>
        <Button variant="ghost" size="sm" className="hidden gap-1.5 text-muted-foreground sm:inline-flex" asChild>
          <Link href="/dashboard" title="Back to dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="sm:hidden" asChild aria-label="Dashboard">
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
