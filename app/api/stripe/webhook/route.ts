import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import {
  getStripe,
  getStripeConfigError,
  isStripeConfigured,
} from '@/lib/stripe-server';
import { syncSubscriptionForPaidCheckoutSession } from '@/lib/stripe-subscription-sync';
import {
  markExistingOrderPaidFromSession,
  processOrderIntentFromSession,
  resolveBaseUrlFromHeaders,
} from '@/lib/stripe-order-intent-sync';

export const runtime = 'nodejs';

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
    const baseUrl = resolveBaseUrlFromHeaders(req.headers);
    try {
      await syncSubscriptionForPaidCheckoutSession(session);
      const paymentMarked = await markExistingOrderPaidFromSession(session);
      if (paymentMarked === 'skipped') {
        await processOrderIntentFromSession(session, baseUrl);
      }
    } catch (e) {
      console.error('Stripe webhook subscription sync failed:', e);
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
