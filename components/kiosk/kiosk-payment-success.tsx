'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  slug: string;
  orderId: string | null;
  ticketFromQuery: number | null;
  sessionId: string | null;
};

export function KioskPaymentSuccess({
  slug,
  orderId,
  ticketFromQuery,
  sessionId,
}: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState<number | null>(ticketFromQuery);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');

  useEffect(() => {
    try {
      localStorage.removeItem(`kiosk-cart-${slug}`);
      localStorage.removeItem(`kiosk-checkout-draft-${slug}`);
    } catch {
      // ignore storage errors
    }
  }, [slug]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`
        );
        const body = (await res.json().catch(() => ({}))) as {
          status?: string;
          paid?: boolean;
        };
        if (!cancelled) {
          setPaymentStatus(body.paid ? 'completed' : body.status ?? 'pending');
        }
      } catch {
        if (!cancelled) setPaymentStatus('pending');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!orderId) return;
    if (ticket != null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/kiosk/order-tracking?orderId=${encodeURIComponent(orderId)}`
        );
        const body = (await res.json().catch(() => ({}))) as {
          data?: { ticketNumber?: number | null; payment?: { status?: string } | null };
        };
        if (!cancelled && body.data) {
          setTicket(body.data.ticketNumber ?? null);
          if (body.data.payment?.status) setPaymentStatus(body.data.payment.status);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, ticket]);

  const printTicket = () => {
    if (typeof window === 'undefined') return;
    window.print();
  };

  return (
    <div className="kiosk-success-root min-h-screen bg-[#f8fafc] px-4 py-10 text-[#0f172a]">
      <div className="mx-auto max-w-xl">
        <Card className="border-[#e2e8f0] bg-white text-[#0f172a] shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Kiosk order confirmed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[#e2e8f0] p-4 text-center">
              <p className="text-xs text-[#64748b]">Ticket Number</p>
              <p className="text-4xl font-bold tabular-nums">
                {ticket != null ? `#${ticket}` : '—'}
              </p>
            </div>
            <div className="text-sm">
              <p>
                <strong>Order ID:</strong> {orderId ?? '—'}
              </p>
              <p>
                <strong>Payment:</strong> {paymentStatus}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                className="bg-[#ea580c] text-white hover:bg-[#c2410c]"
                onClick={printTicket}
              >
                Print Ticket
              </Button>
              <Button
                type="button"
                className="border border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
                onClick={() => router.push(`/kiosk/${encodeURIComponent(slug)}`)}
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
