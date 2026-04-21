import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getStripe, getStripeConfigError, isStripeConfigured } from '@/lib/stripe-server';

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
    return NextResponse.json(
      {
        paid: session.payment_status === 'paid',
        status: session.payment_status,
        metadata: session.metadata ?? {},
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('Verify Stripe session failed:', e);
    return NextResponse.json({ error: 'Could not verify payment session' }, { status: 502 });
  }
}

