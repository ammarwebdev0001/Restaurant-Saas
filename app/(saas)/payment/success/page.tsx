import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStripe, fromStripeUnitAmount, isStripeConfigured } from '@/lib/stripe-server';
import { syncSubscriptionForPaidCheckoutSession } from '@/lib/stripe-subscription-sync';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams?: Promise<{ session_id?: string }>;
};

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const sessionId = typeof params?.session_id === 'string' ? params.session_id.trim() : '';

  if (!sessionId || !isStripeConfigured()) {
    redirect('/payment');
  }

  let displayAmount = '';
  let displayCurrency = '';
  let paid = false;
  let planLabel = '';
  let syncedByServer = false;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });
    paid = session.payment_status === 'paid';
    const currency = (session.currency ?? 'eur').toUpperCase();
    displayCurrency = currency;
    const major = fromStripeUnitAmount(session.amount_total, currency);
    displayAmount = major.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const metaPlan = session.metadata?.plan;
    planLabel = typeof metaPlan === 'string' ? metaPlan : '';
    if (paid) {
      const syncResult = await syncSubscriptionForPaidCheckoutSession(session);
      syncedByServer = syncResult === 'updated';
    }
  } catch {
    redirect('/pricing');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 py-16 text-zinc-900 dark:bg-black dark:text-white">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-fire-500/20 blur-3xl dark:bg-fire-500/25" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-fire-300/20 blur-3xl dark:bg-fire-700/20" />
      <div className="relative mx-auto max-w-lg">
        <Card className="border-zinc-200/80 bg-white/95 shadow-[0_30px_80px_-30px] shadow-black/20 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:shadow-black/60">
          <CardHeader>
            <CardTitle className="text-2xl">
              {paid ? 'Payment successful' : 'Payment status'}
            </CardTitle>
            <CardDescription>
              {paid
                ? 'Thank you. Your card or wallet provider has confirmed the charge.'
                : 'We could not confirm a completed payment for this session.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {paid ? (
              <>
                <div className="rounded-lg border bg-muted/40 p-4">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold tabular-nums">
                      {displayCurrency} {displayAmount}
                    </span>
                  </div>
                  {planLabel ? (
                    <div className="mt-2 flex justify-between gap-2">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{planLabel}</span>
                    </div>
                  ) : null}
                </div>
                <p className="text-muted-foreground">
                  {syncedByServer
                    ? 'Your subscription has been updated on this server.'
                    : 'If webhook delivery is delayed, subscription update may take a short moment.'}{' '}
                  You can return to the dashboard.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                If money was debited, allow a minute and check your Stripe dashboard, or contact
                support with your session reference.
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/pricing">Pricing</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
