'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';

type VerifyPayload = {
  restaurantName: string;
  roleName: string;
  email: string;
};

function InviteRestaurantContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { data: session, status } = useSession();

  const [verify, setVerify] = useState<VerifyPayload | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifyError('Missing invitation link. Open the link from your email.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/restaurant/invites/verify?token=${encodeURIComponent(token)}`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setVerifyError(
              typeof data?.error === 'string'
                ? data.error
                : 'This invitation is not valid.'
            );
          }
          return;
        }
        if (!cancelled) {
          setVerify({
            restaurantName: data.restaurantName,
            roleName: data.roleName,
            email: data.email,
          });
        }
      } catch {
        if (!cancelled) {
          setVerifyError('Could not load invitation.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function accept() {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await fetch('/api/restaurant/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data?.error === 'string'
            ? data.error
            : 'Could not accept invitation.'
        );
        return;
      }
      toast.success('You have joined the restaurant.');
      router.push('/dashboard');
    } catch {
      toast.error('Could not accept invitation.');
    } finally {
      setAccepting(false);
    }
  }

  const sessionEmail =
    session?.user && 'email' in session.user
      ? ((session.user as { email?: string | null }).email ?? null)
      : null;

  const emailMatches =
    verify &&
    sessionEmail &&
    sessionEmail.toLowerCase() === verify.email.toLowerCase();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
        <p className="text-sm text-muted-foreground">Loading invitation…</p>
      </main>
    );
  }

  if (verifyError || !verify || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
        <div className="max-w-md rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Invitation unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {verifyError ??
              (!token
                ? 'Open the link from your invitation email.'
                : 'This invitation could not be loaded.')}
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Join {verify.restaurantName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You have been invited as <strong>{verify.roleName}</strong>. This
          invite is for <strong>{verify.email}</strong>.
        </p>

        {status === 'loading' ? (
          <p className="mt-4 text-sm text-muted-foreground">Checking session…</p>
        ) : status === 'unauthenticated' ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in with the invited email to accept.
            </p>
            <Button asChild className="w-full">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(
                  `/invite/restaurant?token=${encodeURIComponent(token)}`
                )}`}
              >
                Sign in
              </Link>
            </Button>
          </div>
        ) : !emailMatches ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              You are signed in as {sessionEmail}. Sign out and sign in as{' '}
              {verify.email}, or open this link in a private window.
            </p>
            <Button
              variant="outline"
              type="button"
              onClick={() => void signOut({ callbackUrl: '/login' })}
            >
              Sign out
            </Button>
          </div>
        ) : (
          <Button
            className="mt-4 w-full text-white"
            disabled={accepting}
            onClick={() => void accept()}
          >
            {accepting ? 'Accepting…' : 'Accept invitation'}
          </Button>
        )}
      </div>
    </main>
  );
}

export default function InviteRestaurantPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <InviteRestaurantContent />
    </Suspense>
  );
}
