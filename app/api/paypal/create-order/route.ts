import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import {
  createPayPalOrder,
  getPayPalConfigError,
  isPayPalConfigured,
  type PayPalOrderMetadata,
} from '@/lib/paypal-server';
import { getRequestOrigin } from '@/lib/request-origin';

export const runtime = 'nodejs';

const bodySchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.string().min(3).max(3).optional(),
  source: z.enum(['online', 'kiosk', 'subscription']).optional(),
  endpoint: z.enum(['/api/customer/orders', '/api/kiosk/orders']).optional(),
  payload: z.unknown().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

/**
 * Creates a PayPal order for the inline JS-SDK Buttons flow.
 * Returns `{ id }` only — the JS SDK uses that id to open the
 * PayPal-hosted popup and runs `onApprove` after the buyer confirms.
 * The popup supports both **PayPal account** and **Pay with Debit or
 * Credit Card** (Visa / Mastercard / Amex) via PayPal guest checkout.
 */
export async function POST(req: NextRequest) {
  if (!isPayPalConfigured()) {
    return NextResponse.json(
      { error: getPayPalConfigError() ?? 'PayPal is not configured' },
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const origin = await getRequestOrigin();
  const currency = (parsed.data.currency ?? 'EUR').toUpperCase();

  // PayPal `custom_id` has a hard ~127 char limit, which truncates large
  // metadata payloads (e.g. a restaurantId UUID + plan + email). To work
  // around this we always persist the full metadata + optional intent
  // payload server-side under a short id, then pass only that id to PayPal.
  const intentId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `intent-${Date.now()}`;

  const intentValue = JSON.stringify({
    source: parsed.data.source ?? null,
    metadata: parsed.data.metadata ?? {},
    endpoint: parsed.data.endpoint ?? null,
    payload: parsed.data.payload ?? null,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  await db.platformSetting.upsert({
    where: { key: `paypal_order_intent:${intentId}` },
    create: { key: `paypal_order_intent:${intentId}`, value: intentValue },
    update: { value: intentValue },
  });

  const metadata: PayPalOrderMetadata = { intentId };

  try {
    const order = await createPayPalOrder({
      amount: parsed.data.amount,
      currency,
      title: parsed.data.title ?? 'Payment',
      // return_url / cancel_url are required by PayPal but in the JS-SDK
      // popup flow the buyer never gets redirected here. Provide stable
      // origin-relative fallbacks so the order body validates.
      returnUrl: `${origin}/`,
      cancelUrl: `${origin}/`,
      metadata,
    });
    return NextResponse.json({ id: order.id }, { status: 200 });
  } catch (e) {
    console.error('PayPal create-order failed:', e);
    return NextResponse.json(
      { error: 'Could not create PayPal order' },
      { status: 502 }
    );
  }
}
