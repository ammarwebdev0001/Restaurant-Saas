/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Role = 'OWNER' | 'WORKER';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('WORKER');
  const [loading, setLoading] = useState(false);

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, role }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data?.error;

        const msg =
          typeof err === 'string'
            ? err
            : Array.isArray(err?.formErrors) && err.formErrors.length
              ? err.formErrors[0]
              : err?.fieldErrors && typeof err.fieldErrors === 'object'
                ? Object.values(err.fieldErrors)
                    .flat()
                    .filter((x) => typeof x === 'string' && x.length > 0)[0]
                : null;

        toast.error(msg ?? 'Signup failed. Please check your inputs.');
        return;
      }

      const login = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!login?.ok) {
        const err = (login as any)?.error;
        const status = (login as any)?.status;
        console.log('[register][credentials] signIn response:', {
          ok: (login as any)?.ok,
          error: err,
          status,
        });
        toast.error(
          err === 'CredentialsSignin'
            ? 'Invalid email or password after signup.'
            : err === 'AccessDenied'
              ? 'Access denied.'
              : err
                ? `Login failed: ${err}`
                : status === 401
                  ? 'Unauthorized (invalid credentials).'
                  : 'Login failed.'
        );
        return;
      }

      toast.success('Signup successful.');
      if (role === 'OWNER') {
        router.push('/onboarding/1');
      } else {
        router.push('/dashboard');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Signup failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup(targetRole: Role) {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: `/role?role=${targetRole}` });
    } catch (e: any) {
      toast.error(e?.message ?? 'Google signup failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-0px)] items-center justify-center bg-gray-200 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-semibold">
          Create account
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Signup with Google or email + password.
        </p>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleGoogleSignup('OWNER')}
            disabled={loading}
            variant="secondary"
          >
            Sign up with Google (Owner)
          </Button>
          <Button
            onClick={() => handleGoogleSignup('WORKER')}
            disabled={loading}
            variant="secondary"
          >
            Sign up with Google (Worker)
          </Button>
        </div>

        <div className="my-6 border-t" />

        <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              required
            >
              <option value="OWNER">Owner</option>
              <option value="WORKER">Worker</option>
            </select>
          </div>

          <Button disabled={loading} type="submit">
            {loading ? 'Creating...' : 'Sign up'}
          </Button>

          <div className="text-center text-sm">
            <Link className="text-primary underline" href="/login">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
