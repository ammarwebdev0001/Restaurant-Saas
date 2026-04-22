import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getStripe, getStripeConfigError, isStripeConfigured } from '@/lib/stripe-server';
import {
  markExistingOrderPaidFromSession,
  processOrderIntentFromSession,
  resolveBaseUrlFromHeaders,
} from '@/lib/stripe-order-intent-sync';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: getStripeConfigError() ?? 'Stripe is not configured' },
      { status: 503 }
    );
  }

  const sessionId = req.nextUrl.searchParams.get('session_id')?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const baseUrl = resolveBaseUrlFromHeaders(req.headers);
    let orderSync: 'skipped' | 'completed' | 'already_completed' = 'skipped';
    let orderId: string | undefined;
    if (session.payment_status === 'paid') {
      try {
        const paymentMarked = await markExistingOrderPaidFromSession(session);
        if (paymentMarked !== 'skipped') {
          orderSync = paymentMarked === 'updated' ? 'completed' : 'already_completed';
          orderId =
            typeof session.metadata?.orderId === 'string'
              ? session.metadata.orderId.trim() || undefined
              : undefined;
        } else {
          const result = await processOrderIntentFromSession(session, baseUrl);
          orderSync = result.status;
          orderId = result.orderId;
        }
      } catch (e) {
        console.error('Verify session order sync failed:', e);
      }
    }
    return NextResponse.json(
      {
        paid: session.payment_status === 'paid',
        status: session.payment_status,
        metadata: session.metadata ?? {},
        orderSync,
        orderId,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('Verify Stripe session failed:', e);
    return NextResponse.json({ error: 'Could not verify payment session' }, { status: 502 });
  }
}

