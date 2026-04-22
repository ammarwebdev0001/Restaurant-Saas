import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { getRequestOrigin } from '@/lib/request-origin';
import {
  checkoutPaymentMethodTypes,
  getStripe,
  getStripeConfigError,
  isStripeConfigured,
  minimumCheckoutAmountMajor,
  toStripeUnitAmount,
} from '@/lib/stripe-server';

export const runtime = 'nodejs';

const bodySchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.string().min(3).max(3).optional(),
  source: z.enum(['online', 'kiosk']),
  endpoint: z.enum(['/api/customer/orders', '/api/kiosk/orders']).optional(),
  payload: z.unknown().optional(),
  successPath: z.string().min(1).max(500),
  cancelPath: z.string().min(1).max(500),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: getStripeConfigError() ?? 'Stripe is not configured' },
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const origin = await getRequestOrigin();
  const currency = (parsed.data.currency ?? 'eur').toLowerCase();
  const minMajor = minimumCheckoutAmountMajor(currency);
  if (parsed.data.amount < minMajor) {
    return NextResponse.json(
      {
        error: `Minimum Stripe checkout amount is ${currency.toUpperCase()} ${minMajor.toFixed(
          2
        )}.`,
      },
      { status: 400 }
    );
  }
  const unitAmount = toStripeUnitAmount(parsed.data.amount, currency);
  if (unitAmount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const successUrl = new URL(parsed.data.successPath, origin).toString();
  const cancelUrl = new URL(parsed.data.cancelPath, origin).toString();

  try {
    const shouldStoreIntent = !!parsed.data.endpoint && parsed.data.payload != null;
    const intentId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `intent-${Date.now()}`;
    if (shouldStoreIntent) {
      const intentKey = `stripe_order_intent:${intentId}`;
      await db.platformSetting.upsert({
        where: { key: intentKey },
        create: {
          key: intentKey,
          value: JSON.stringify({
            source: parsed.data.source,
            endpoint: parsed.data.endpoint,
            payload: parsed.data.payload,
            status: 'pending',
            createdAt: new Date().toISOString(),
          }),
        },
        update: {
          value: JSON.stringify({
            source: parsed.data.source,
            endpoint: parsed.data.endpoint,
            payload: parsed.data.payload,
            status: 'pending',
            createdAt: new Date().toISOString(),
          }),
        },
      });
    }

    const stripe = getStripe();
    let paymentMethodTypes = checkoutPaymentMethodTypes();
    let checkout;
    try {
      checkout = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: paymentMethodTypes,
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: unitAmount,
              product_data: {
                name: parsed.data.title ?? 'Order payment',
                description: parsed.data.description,
              },
            },
          },
        ],
        metadata: {
          ...(parsed.data.metadata ?? {}),
          source: parsed.data.source,
          ...(shouldStoreIntent ? { intentId } : {}),
        },
        payment_intent_data: {
          metadata: {
            ...(parsed.data.metadata ?? {}),
            source: parsed.data.source,
            ...(shouldStoreIntent ? { intentId } : {}),
          },
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (paymentMethodTypes.includes('paypal') && /paypal/i.test(msg)) {
        paymentMethodTypes = paymentMethodTypes.filter((t) => t !== 'paypal');
        if (paymentMethodTypes.length === 0) paymentMethodTypes = ['card', 'link'];
        checkout = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: paymentMethodTypes,
          success_url: successUrl,
          cancel_url: cancelUrl,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency,
                unit_amount: unitAmount,
                product_data: {
                  name: parsed.data.title ?? 'Order payment',
                  description: parsed.data.description,
                },
              },
            },
          ],
          metadata: {
            ...(parsed.data.metadata ?? {}),
            source: parsed.data.source,
            ...(shouldStoreIntent ? { intentId } : {}),
          },
          payment_intent_data: {
            metadata: {
              ...(parsed.data.metadata ?? {}),
              source: parsed.data.source,
              ...(shouldStoreIntent ? { intentId } : {}),
            },
          },
        });
      } else {
        throw e;
      }
    }

    if (!checkout.url) {
      return NextResponse.json(
        { error: 'Stripe did not return checkout URL' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkout.url, id: checkout.id }, { status: 200 });
  } catch (e) {
    console.error('Create order checkout failed:', e);
    const msg = e instanceof Error ? e.message : String(e);
    if (/amount_too_small|at least 50 cents/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            'Order total is too small for Stripe minimum charge. Add more items and try again.',
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Could not start Stripe checkout' }, { status: 502 });
  }
}

