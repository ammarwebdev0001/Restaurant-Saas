import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Stripe webhook endpoint retained for backward compatibility only.
  // PayPal flows are captured via `/api/stripe/verify-session` using token/order id.
  void req;
  return NextResponse.json({ received: true, provider: 'paypal' }, { status: 200 });
}
