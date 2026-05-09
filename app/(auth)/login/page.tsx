/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { getSession, useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PublicAuthShell } from '@/components/marketing/public-auth-shell';
import { IconBrandGoogleFilled } from '@tabler/icons-react';
import { isPlatformAdmin } from '@/lib/auth/admin';

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/dashboard';
  }
  return raw;
}

function roleDefaultPath(
  email: string | null | undefined,
  roleName: string | null | undefined,
  legacyRole: string | null | undefined
): string {
  if (isPlatformAdmin(email, legacyRole)) return '/admin/dashboard';
  const normalizedName = (roleName ?? '').trim().toLowerCase();
  if (normalizedName === 'user') return '/';
  if (legacyRole === 'USER') return '/';
  return '/dashboard';
}

/**
 * Where to send the user after sign-in.
 * Platform admins (`ADMIN_EMAIL` / etc., or JWT `role === ADMIN`) go to SaaS admin even
 * with no `roleId` yet (Google/new users allowed).
 */
function postLoginPath(
  user:
    | {
        email?: string | null;
        roleId?: string | null;
        roleName?: string | null;
        role?: string | null;
      }
    | undefined,
  hasExplicitCallback: boolean,
  callbackUrl: string
): string {
  if (hasExplicitCallback) return callbackUrl;

  const legacyRole = user?.role ?? undefined;
  if (isPlatformAdmin(user?.email, legacyRole)) return '/admin/dashboard';

  const roleId = user?.roleId;
  if (roleId == null || roleId === '') return '/';

  return roleDefaultPath(user?.email, user?.roleName, legacyRole);
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlParam = searchParams.get('callbackUrl');
  const callbackUrl = safeCallbackUrl(callbackUrlParam);
  const hasExplicitCallback = Boolean(callbackUrlParam);
  const { data: session, status } = useSession();
  const targetAfterLogin = postLoginPath(
    session?.user,
    hasExplicitCallback,
    callbackUrl
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const nextPath = postLoginPath(
        fresh?.user, 
        hasExplicitCallback,
        callbackUrl
      );
      router.push(nextPath);
    } catch (e: any) {
      toast.error(e?.message ?? 'Login failed (server error).');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthShell title="Sign in" subtitle="Use Google or your email + password.">

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
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </Button>
            </div>
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
    </PublicAuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
