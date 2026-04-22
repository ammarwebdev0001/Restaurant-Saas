'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OrderInfo } from '@/components/order/order-types';

type Props = {
  flowOrderId: string;
  trackingOrderId: string | null;
  sessionId: string | null;
  orderType: 'delivery' | 'pickUp';
  orderInfo?: OrderInfo;
};

export function OnlinePaymentSuccess({
  flowOrderId,
  trackingOrderId,
  sessionId,
  orderInfo,
}: Props) {
  const router = useRouter();
  const [paid, setPaid] = useState<boolean | null>(null);
  const restaurantSlug = orderInfo?.restaurantSlug?.trim() || '';
  const storefrontHome = `/web-app/${encodeURIComponent(restaurantSlug)}`;

  useEffect(() => {
    try {
      localStorage.removeItem(`cart-${flowOrderId}`);
    } catch {
      // ignore storage errors
    }
  }, [flowOrderId]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`
        );
        const body = (await res.json().catch(() => ({}))) as { paid?: boolean };
        if (!cancelled) setPaid(res.ok && body.paid === true);
      } catch {
        if (!cancelled) setPaid(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Payment successful</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {paid === false
                ? 'Payment confirmation is still syncing. Please keep this tracking ID.'
                : 'Your order is confirmed. Use the tracking ID below to check status.'}
            </p>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Tracking ID</p>
              <p className="font-mono text-lg font-semibold">
                {trackingOrderId ?? 'Unavailable'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link
                  href={`/web-app/${encodeURIComponent(restaurantSlug)}/track-order${
                    trackingOrderId
                      ? `?orderId=${encodeURIComponent(trackingOrderId)}`
                      : ''
                  }`}
                >
                  Track your order
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(storefrontHome)}
                disabled={!restaurantSlug}
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}