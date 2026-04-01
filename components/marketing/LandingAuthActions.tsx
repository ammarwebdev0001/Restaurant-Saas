'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, LogOut, Shield, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { isPlatformAdmin } from '@/lib/auth/admin';

export default function LandingAuthActions() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const showAdmin =
    session?.user &&
    isPlatformAdmin(session.user.email, session.user.role);
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
      <Button size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button size="sm" asChild>
        <Link href="/register">Get Started</Link>
      </Button>
    );
  }

  return (
    <div ref={rootRef} className="relative z-[120]">
      <Button
        size="sm"
        variant="default"
        className="h-9 w-9 p-0"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open user menu"
      >
        <User className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 z-[130] mt-2 w-44 rounded-md border bg-background p-1 shadow-md">
          <Link
            href="/dashboard"
            className="flex items-center rounded-sm px-3 py-2 text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
          {showAdmin && (
            <Link
              href="/admin/dashboard"
              className="flex items-center rounded-sm px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              <Shield className="mr-2 h-4 w-4" />
              SaaS admin
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
