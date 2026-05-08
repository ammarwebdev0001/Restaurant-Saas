import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SubscriptionPlan } from '@prisma/client';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { createPayPalOrder, getPayPalConfigError, isPayPalConfigured } from '@/lib/paypal-server';
import { getRestaurantForUser } from '@/lib/restaurant-owner';
import { getRequestOrigin } from '@/lib/request-origin';

export const runtime = 'nodejs';

const bodySchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
});

export async function POST(req: NextRequest) {
  if (!isPayPalConfigured()) {
    return NextResponse.json(
      {
        error:
          getPayPalConfigError() ??
          'PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET on the server.',
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

  const currency = 'EUR';
  if (!Number.isFinite(catalog.price) || catalog.price <= 0) {
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
  try {
    const checkout = await createPayPalOrder({
      amount: catalog.price,
      currency,
      title: catalog.name,
      returnUrl: `${origin}/payment/success?plan=${encodeURIComponent(parsed.data.plan)}`,
      cancelUrl: `${origin}/payment?plan=${encodeURIComponent(parsed.data.plan)}`,
      metadata: {
        plan: parsed.data.plan,
        ...(restaurantId ? { restaurantId } : {}),
        ...(userId ? { userId } : {}),
        ...(email ? { userEmail: email } : {}),
      },
    });
    return NextResponse.json({ url: checkout.url, id: checkout.id }, { status: 200 });
  } catch (e) {
    console.error('PayPal checkout create failed:', e);
    return NextResponse.json({ error: 'Could not start PayPal checkout.' }, { status: 502 });
  }
}
