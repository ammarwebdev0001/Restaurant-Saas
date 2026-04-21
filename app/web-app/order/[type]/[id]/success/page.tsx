import Link from 'next/link';
import { notFound } from 'next/navigation';

import { OnlineSuccessCartCleaner } from '@/components/order/online-success-cart-cleaner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ slug?: string; orderRef?: string; session_id?: string }>;
};

export default async function OnlineOrderSuccessPage({
  params,
  searchParams,
}: Props) {
  const { type, id } = await params;
  const mode =
    type === 'pickUp' || type.toLowerCase() === 'pickup'
      ? 'pickUp'
      : type === 'delivery'
        ? 'delivery'
        : null;
  if (!mode) notFound();

  const sp = await searchParams;
  const slug =
    typeof sp.slug === 'string' && sp.slug.trim() ? sp.slug.trim() : null;
  const orderRef =
    typeof sp.orderRef === 'string' && sp.orderRef.trim()
      ? sp.orderRef.trim()
      : null;
  const hasSessionId =
    typeof sp.session_id === 'string' && sp.session_id.trim().length > 0;

  return (
    <main className="min-h-screen bg-background px-4 py-14 text-foreground">
      <OnlineSuccessCartCleaner orderId={id} hasSessionId={hasSessionId} />
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Payment successful</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your {mode === 'delivery' ? 'delivery' : 'pick-up'} order has been
              paid and sent to the restaurant.
            </p>
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p>
                <strong>Order flow id:</strong> {id}
              </p>
              {orderRef ? (
                <p className="mt-1">
                  <strong>Order reference:</strong> {orderRef}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {slug ? (
                <Button asChild className="w-full">
                  <Link href={`/web-app/${encodeURIComponent(slug)}`}>
                    Back to store
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/pricing">Continue</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
