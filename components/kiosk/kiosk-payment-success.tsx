'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconHome, IconPrinter } from '@tabler/icons-react';

type Props = {
  slug: string;
  orderId: string | null;
  ticketFromQuery: number | null;
  sessionId: string | null;
  token?: string | null;
};

export function KioskPaymentSuccess({
  slug,
  orderId,
  ticketFromQuery,
  sessionId,
  token,
}: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState<number | null>(ticketFromQuery);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [trackingId, setTrackingId] = useState<string | null>(orderId);

  useEffect(() => {
    try {
      localStorage.removeItem(`kiosk-cart-${slug}`);
      localStorage.removeItem(`kiosk-checkout-draft-${slug}`);
    } catch {
      // ignore storage errors
    }
  }, [slug]);

  useEffect(() => {
    const paymentToken = sessionId ?? token ?? null;
    if (!paymentToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/stripe/verify-session?token=${encodeURIComponent(paymentToken)}`
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
  }, [sessionId, token]);

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
          data?: {
            shortOrderId?: string;
            ticketNumber?: number | null;
            payment?: { status?: string } | null;
          };
        };
        if (!cancelled && body.data) {
          setTrackingId(body.data.shortOrderId ?? orderId);
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

  const printTicket = async () => {
    if (typeof window === 'undefined') return;
    if (!orderId) {
      window.print();
      return;
    }

    try {
      const [orderRes, restaurantRes] = await Promise.all([
        fetch(`/api/kiosk/order-tracking?orderId=${encodeURIComponent(orderId)}`, {
          cache: 'no-store',
        }),
        fetch(`/api/customer/restaurant?slug=${encodeURIComponent(slug)}`, {
          cache: 'no-store',
        }),
      ]);

      const orderBody = (await orderRes.json().catch(() => ({}))) as {
        data?: {
          id: string;
          shortOrderId?: string;
          ticketNumber?: number | null;
          total?: number;
          createdAt?: string;
          payment?: { method?: string; status?: string; amount?: number } | null;
          items?: Array<{
            name: string;
            quantity: number;
            price: number;
            modifiers?: Array<{
              id: string;
              name: string;
              quantity: number;
              unitPrice: number;
            }>;
          }>;
        };
      };
      const restaurantBody = (await restaurantRes.json().catch(() => ({}))) as {
        data?: { name?: string | null; logoUrl?: string | null } | null;
      };

      const details = orderBody.data;
      const restaurantName = restaurantBody.data?.name?.trim() || 'Restaurant';
      const logoUrl = restaurantBody.data?.logoUrl ?? null;
      const ticketNo = details?.ticketNumber ?? ticket;
      const displayTrackingId = details?.shortOrderId ?? details?.id ?? trackingId ?? orderId;
      const items = details?.items ?? [];
      const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const total = details?.total ?? subtotal;
      const tax = Math.max(0, total - subtotal);
      const paymentMethod = details?.payment?.method ?? 'PayPal';
      const paymentState = details?.payment?.status ?? paymentStatus ?? 'pending';
      const paidAmount = details?.payment?.amount ?? total;

      const rows = items
        .map((it) => {
          const modifierRows = (it.modifiers ?? [])
            .map(
              (m) => `<tr>
<td style="padding-left:10px;color:#555;">${m.name}</td>
<td class="qty">${m.quantity}</td>
<td class="amt">€${(m.unitPrice * m.quantity).toFixed(2)}</td>
</tr>`
            )
            .join('');
          return `<tr>
<td>${it.name}</td>
<td class="qty">${it.quantity}</td>
<td class="amt">€${(it.price * it.quantity).toFixed(2)}</td>
</tr>${modifierRows}`;
        })
        .join('');

      const html = `<!doctype html>
<html>
<head>
  <title>Kiosk Ticket</title>
  <style>
    @page { size: 2in auto; margin: 0.06in; }
    html, body { width: 2in; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #111; font-size: 10px; line-height: 1.35; }
    .r { width: 100%; box-sizing: border-box; }
    .center { text-align: center; }
    .muted { color: #555; font-size: 9px; }
    .brand { display:flex; align-items:center; justify-content:center; gap: 6px; margin-bottom: 4px; }
    .logo { width:42px; height:42px; object-fit:cover; border-radius:999px; border:1px solid #ddd; }
    .name { font-size: 12px; font-weight: 700; line-height: 1.2; max-width: 1.35in; }
    .sep { border-top: 1px dashed #555; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 2px 0; font-size: 9px; vertical-align: top; }
    th { text-align: left; font-weight: 700; }
    .qty, .amt { white-space: nowrap; text-align: right; }
    .totals { margin-top: 4px; }
    .totals div { display:flex; justify-content:space-between; margin-top: 1px; }
    .grand { font-weight: 700; font-size: 11px; }
  </style>
</head>
<body>
  <div class="r">
    <div class="brand">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ''}
      <div class="name">${restaurantName}</div>
    </div>
    <div class="center muted">${details?.createdAt ? new Date(details.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
    <div class="sep"></div>
    ${ticketNo != null ? `<div><strong>Ticket:</strong> #${ticketNo}</div>` : ''}
    <div><strong>Tracking:</strong> ${displayTrackingId ?? '—'}</div>
    <div><strong>Payment:</strong> ${paymentMethod}</div>
    <div><strong>Status:</strong> ${paymentState}</div>
    <div class="sep"></div>
    <table>
      <thead>
        <tr><th>Item</th><th class="qty">Qty</th><th class="amt">Amt</th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="3" class="muted">No items</td></tr>'}</tbody>
    </table>
    <div class="sep"></div>
    <div class="totals">
      <div><span>Subtotal</span><span>€${subtotal.toFixed(2)}</span></div>
      <div><span>Tax</span><span>€${tax.toFixed(2)}</span></div>
      <div><span>Paid</span><span>€${paidAmount.toFixed(2)}</span></div>
      <div class="grand"><span>Total</span><span>€${total.toFixed(2)}</span></div>
    </div>
    <div class="sep"></div>
    <div class="center muted">Thank you!</div>
  </div>
</body>
</html>`;

      const frame = document.createElement('iframe');
      frame.style.position = 'fixed';
      frame.style.right = '0';
      frame.style.bottom = '0';
      frame.style.width = '0';
      frame.style.height = '0';
      frame.style.border = '0';
      frame.setAttribute('aria-hidden', 'true');
      document.body.appendChild(frame);

      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        window.setTimeout(() => {
          frame.remove();
        }, 300);
      };

      const doc = frame.contentWindow?.document;
      if (!doc || !frame.contentWindow) {
        cleanup();
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();
      frame.onload = () => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } finally {
          cleanup();
        }
      };
    } catch {
      window.print();
    }
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
                <strong>Tracking ID:</strong> {trackingId ?? '—'}
              </p>
              <p>
                <strong>Payment:</strong> {paymentStatus}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                className="bg-primary text-white hover:bg-primary/90"
                onClick={printTicket}
              >
                <IconPrinter className="w-4 h-4 mr-2" />
                Print Ticket
              </Button>
              <Button
                type="button"
                className="border border-primary bg-white text-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => router.push(`/kiosk/${encodeURIComponent(slug)}`)}
              >
                <IconHome className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
