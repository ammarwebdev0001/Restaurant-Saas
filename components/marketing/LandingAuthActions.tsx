'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, LogOut, Shield, User, User2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { isPlatformAdminSession } from '@/lib/auth/admin';
import { cn } from '@/lib/utils';

export type LandingAuthActionsProps = {
  loggedOutLabel?: string;
  loggedOutClassName?: string;
  loggedInTriggerClassName?: string;
  loadingClassName?: string;
  /** Panel position (e.g. open above trigger in tight mobile drawers). */
  menuClassName?: string;
};

export default function LandingAuthActions({
  loggedOutLabel = 'Get Started',
  loggedOutClassName,
  loggedInTriggerClassName,
  loadingClassName,
  menuClassName,
}: LandingAuthActionsProps = {}) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const showAdmin = isPlatformAdminSession(session?.user);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (status === 'loading') {
    return (
      <Button size="sm" disabled className={loadingClassName}>
        Loading...
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button size="sm" asChild className={loggedOutClassName}>
        <Link href="/register">{loggedOutLabel}</Link>
      </Button>
    );
  }

  return (
    <div ref={rootRef} className="relative z-[120]">
      <Button
        variant="default"
        className={cn('h-9 w-9 p-0')}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open user menu"
      >
        <User2 className="h-4 w-4" />
      </Button>

      {open && (
        <div
          className={cn(
            'absolute right-0 z-[130] w-44 rounded-md border bg-background p-1 shadow-md',
            menuClassName ?? 'mt-2 top-full'
          )}
        >
          {showAdmin ? (
            <Link
              href="/admin/dashboard"
              className="flex items-center rounded-sm px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              <Shield className="mr-2 h-4 w-4" />
              Foodluk admin
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center rounded-sm px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          )}
          <button
            type="button"
            className="flex items-center w-full rounded-sm px-3 py-2 text-left text-red-500 text-sm hover:bg-accent"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
