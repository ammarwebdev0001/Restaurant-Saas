'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { isPlatformAdmin } from '@/lib/auth/admin';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Sign in to access Foodluk admin.</p>
        <Link href="/login?callbackUrl=/admin/dashboard" className="text-primary underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (!isPlatformAdmin(session.user.email, session.user.role)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-medium">Access denied</p>
        <p className="max-w-md text-sm text-muted-foreground">
          This area is for platform administrators only. Use account role <code className="rounded bg-muted px-1">ADMIN</code> or set{' '}
          <code className="rounded bg-muted px-1">ADMIN_EMAIL</code> /{' '}
          <code className="rounded bg-muted px-1">ADMIN_EMAILS</code> in the environment.
        </p>
        <Link href="/" className="mt-2 text-sm text-primary underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
