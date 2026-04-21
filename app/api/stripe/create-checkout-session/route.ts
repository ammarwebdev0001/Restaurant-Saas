import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SubscriptionPlan } from '@prisma/client';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';
import { getRequestOrigin } from '@/lib/request-origin';
import {
  checkoutPaymentMethodTypes,
  getStripeConfigError,
  getStripe,
  getStripeCurrency,
  isStripeConfigured,
  toStripeUnitAmount,
} from '@/lib/stripe-server';

export const runtime = 'nodejs';

const bodySchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
});

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          getStripeConfigError() ??
          'Stripe is not configured. Set STRIPE_SECRET_KEY on the server.',
      },
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

  const catalog = await db.subscriptionCatalog.findUnique({
    where: { plan: parsed.data.plan },
  });
  if (!catalog) {
    return NextResponse.json({ error: 'Unknown subscription plan' }, { status: 404 });
  }

  const currency = getStripeCurrency();
  const unitAmount = toStripeUnitAmount(catalog.price, currency);
  if (unitAmount <= 0) {
    return NextResponse.json({ error: 'Invalid plan price for checkout' }, { status: 400 });
  }

  const session = await getAppSession();
  const email =
    typeof session?.user?.email === 'string' && session.user.email.trim() !== ''
      ? session.user.email.trim()
      : undefined;

  let restaurantId: string | undefined;
  let userId: string | undefined;
  if (email) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) {
      userId = user.id;
      const restaurant = await getRestaurantForUser(user.id);
      if (restaurant) restaurantId = restaurant.id;
    }
  }

  const origin = await getRequestOrigin();
  const stripe = getStripe();

  let paymentMethodTypes = checkoutPaymentMethodTypes();
  const baseParams = {
    mode: 'payment' as const,
    success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/payment?plan=${encodeURIComponent(parsed.data.plan)}`,
    ...(email ? { customer_email: email } : {}),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: catalog.name,
            description: catalog.description.slice(0, 500),
          },
        },
      },
    ],
    metadata: {
      plan: parsed.data.plan,
      ...(restaurantId ? { restaurantId } : {}),
      ...(userId ? { userId } : {}),
    },
    payment_intent_data: {
      metadata: {
        plan: parsed.data.plan,
        ...(restaurantId ? { restaurantId } : {}),
        ...(userId ? { userId } : {}),
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto' as const,
  };

  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      ...baseParams,
      payment_method_types: paymentMethodTypes,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (paymentMethodTypes.includes('paypal') && /paypal/i.test(msg)) {
      paymentMethodTypes = paymentMethodTypes.filter((t) => t !== 'paypal');
      if (paymentMethodTypes.length === 0) paymentMethodTypes = ['card', 'link'];
      checkoutSession = await stripe.checkout.sessions.create({
        ...baseParams,
        payment_method_types: paymentMethodTypes,
      });
    } else {
      console.error('Stripe checkout create failed:', e);
      const msg = e instanceof Error ? e.message : String(e);
      if (/secret.*key.*required|publishable api key|pk_/i.test(msg)) {
        return NextResponse.json(
          {
            error:
              'Stripe key misconfiguration: use STRIPE_SECRET_KEY with sk_test_* or sk_live_*, not pk_*.',
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Could not start checkout. Check Stripe dashboard and currency support.' },
        { status: 502 }
      );
    }
  }

  if (!checkoutSession.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });
  }

  return NextResponse.json(
    { url: checkoutSession.url, id: checkoutSession.id },
    { status: 200 }
  );
}
