'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type Props = {
  plan: string;
  planName: string;
  priceLabel: string;
  description: string;
  features: string[];
  stripeReady: boolean;
  stripeConfigError?: string | null;
  signedIn: boolean;
  userEmail: string | null;
};

export function PaymentCheckoutClient({
  plan,
  planName,
  priceLabel,
  description,
  features,
  stripeReady,
  stripeConfigError,
  signedIn,
  userEmail,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    if (!stripeReady) {
      toast.error('Payments are not configured yet.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: unknown };
      if (!res.ok) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : 'Could not start checkout. Try again or contact support.';
        toast.error(msg);
        return;
      }
      if (typeof data.url === 'string' && data.url.startsWith('http')) {
        window.location.assign(data.url);
        return;
      }
      toast.error('Invalid checkout response.');
    } catch {
      toast.error('Network error starting checkout.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
            <p className="mt-2 text-muted-foreground">
              Secure payment powered by Stripe. Pay with card, Link, or PayPal (when enabled on
              your Stripe account).
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>What you get</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-primary" />
              <span>256-bit TLS encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>PCI-compliant checkout (Stripe)</span>
            </div>
          </div>

          {!stripeReady ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              {stripeConfigError ?? 'Stripe is not configured on this server.'} Add{' '}
              <code className="rounded bg-muted px-1">STRIPE_SECRET_KEY</code> to enable payments.
            </p>
          ) : null}
        </div>

        <Card className="h-fit shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Order summary</CardTitle>
            <CardDescription>Plan {planName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-muted-foreground">Due today</span>
              <span className="text-2xl font-bold tabular-nums">{priceLabel}</span>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              <p>
                Billing uses the price from your catalog for plan <strong>{plan}</strong>. Card,
                Link, and other methods you enable in Stripe (including PayPal where available)
                appear on the next screen.
              </p>
            </div>
            {signedIn && userEmail ? (
              <p className="text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{userEmail}</span>.
                After payment, your restaurant subscription will update automatically when the
                webhook is configured.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                You are not signed in. You can still pay; to attach this payment to your restaurant
                automatically, sign in first then return to this page.
              </p>
            )}
            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={loading || !stripeReady}
              onClick={() => void startCheckout()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                'Continue to secure payment'
              )}
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="flex-1" asChild type="button">
                <Link href="/pricing">Back to pricing</Link>
              </Button>
              <Button variant="ghost" className="flex-1" asChild type="button">
                <Link href="/restaurant-signup">Restaurant signup</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
