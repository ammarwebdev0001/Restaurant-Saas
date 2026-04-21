import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { db } from '@/lib/db';
import {
  getStripe,
  getStripeConfigError,
  isStripeConfigured,
} from '@/lib/stripe-server';
import { syncSubscriptionForPaidCheckoutSession } from '@/lib/stripe-subscription-sync';

export const runtime = 'nodejs';

function resolveWebhookBaseUrl(req: NextRequest): string {
  const envRaw = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envRaw) {
    try {
      const parsed = new URL(envRaw);
      const isLocal =
        parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
      if (!(process.env.NODE_ENV === 'production' && isLocal)) {
        return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, '');
      }
    } catch {
      // Ignore invalid env and fall back to request headers.
    }
  }

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

async function processOrderIntentFromSession(
  session: Stripe.Checkout.Session,
  baseUrl: string
) {
  if (session.payment_status !== 'paid') return;
  const intentId =
    typeof session.metadata?.intentId === 'string' ? session.metadata.intentId.trim() : '';
  if (!intentId) return;

  const key = `stripe_order_intent:${intentId}`;
  const row = await db.platformSetting.findUnique({
    where: { key },
    select: { key: true, value: true },
  });
  if (!row) return;

  let parsed:
    | {
        endpoint?: '/api/customer/orders' | '/api/kiosk/orders';
        payload?: unknown;
        status?: string;
      }
    | undefined;
  try {
    parsed = JSON.parse(row.value) as {
      endpoint?: '/api/customer/orders' | '/api/kiosk/orders';
      payload?: unknown;
      status?: string;
    };
  } catch {
    throw new Error(`Invalid order intent payload for ${key}`);
  }

  if (!parsed?.endpoint || !parsed.payload) return;
  if (parsed.status === 'completed') return;

  const res = await fetch(`${baseUrl}${parsed.endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    await db.platformSetting.update({
      where: { key },
      data: {
        value: JSON.stringify({
          ...parsed,
          status: 'failed',
          stripeSessionId: session.id,
          lastError: body.slice(0, 500),
          lastStatusCode: res.status,
          lastAttemptedAt: new Date().toISOString(),
        }),
      },
    });
    throw new Error(
      `Webhook order creation failed for ${parsed.endpoint} (${res.status}): ${body.slice(0, 500)}`
    );
  }

  const body = (await res.json().catch(() => ({}))) as { data?: { orderId?: string } };
  const orderId =
    typeof body?.data?.orderId === 'string' ? body.data.orderId : undefined;
  await db.platformSetting.update({
    where: { key },
    data: {
      value: JSON.stringify({
        ...parsed,
        status: 'completed',
        stripeSessionId: session.id,
        orderId,
        completedAt: new Date().toISOString(),
      }),
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: getStripeConfigError() ?? 'Stripe not configured' },
      { status: 503 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is missing');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const baseUrl = resolveWebhookBaseUrl(req);
    try {
      await syncSubscriptionForPaidCheckoutSession(session);
      await processOrderIntentFromSession(session, baseUrl);
    } catch (e) {
      console.error('Stripe webhook subscription sync failed:', e);
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
