/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { getSession, useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconBrandGoogle, IconBrandGoogleFilled } from '@tabler/icons-react';

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/dashboard';
  }
  return raw;
}

function roleDefaultPath(
  roleName: string | null | undefined,
  legacyRole: string | null | undefined
): string {
  const normalizedName = (roleName ?? '').trim().toLowerCase();
  if (normalizedName === 'admin') return '/admin/dashboard';
  if (normalizedName === 'user') return '/';
  if (legacyRole === 'ADMIN') return '/admin/dashboard';
  if (legacyRole === 'USER') return '/';
  return '/dashboard';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlParam = searchParams.get('callbackUrl');
  const callbackUrl = safeCallbackUrl(callbackUrlParam);
  const hasExplicitCallback = Boolean(callbackUrlParam);
  const { data: session, status } = useSession();
  const targetAfterLogin = hasExplicitCallback
    ? callbackUrl
    : roleDefaultPath((session?.user as any)?.roleName, session?.user?.role);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(targetAfterLogin);
    }
  }, [status, router, targetAfterLogin]);

  async function handleGoogle() {
    setLoading(true);
    try {
      await signIn('google', {
        callbackUrl: hasExplicitCallback ? callbackUrl : '/login',
      });
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required.');
      return;
    }
    if (!password) {
      toast.error('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result?.ok) {
        const err = (result as any)?.error;
        const statusCode = (result as any)?.status;
        console.log('[login][credentials] signIn response:', {
          ok: (result as any)?.ok,
          error: err,
          status: statusCode,
        });
        toast.error(
          err === 'CredentialsSignin'
            ? 'Invalid email or password.'
            : err === 'AccessDenied'
              ? 'Access denied.'
              : err
                ? `Login failed: ${err}`
                : statusCode === 401
                  ? 'Unauthorized (invalid credentials).'
                  : 'Login failed.'
        );
        return;
      }
      const fresh = await getSession();
      const fallbackAfterLogin = roleDefaultPath(
        (fresh?.user as any)?.roleName,
        fresh?.user?.role
      );
      router.push(
        hasExplicitCallback ? result.url ?? callbackUrl : fallbackAfterLogin
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Login failed (server error).');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-0px)] items-center justify-center bg-gray-200 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-semibold">Sign in</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Use Google or your email + password.
        </p>

        <div className="flex flex-col gap-2">
          <Button onClick={handleGoogle} disabled={loading} variant="secondary">
            <IconBrandGoogleFilled className="mr-1 h-4 w-4" /> Continue with Google
          </Button>
          
        </div>

        <div className="my-6 border-t" />

        <form onSubmit={handleCredentials} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <Button disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Login'}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link className="text-primary underline" href="/reset-password">
              Forgot password?
            </Link>
            <Link className="text-primary underline" href="/register">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-0px)] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
