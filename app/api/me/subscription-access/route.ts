import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getRestaurantIdForRequest } from '@/lib/restaurant-owner';
import { evaluateSubscriptionAccess } from '@/lib/subscription-access';
import { getPlanFeatures } from '@/lib/subscription-plan-features';

export async function GET(req: NextRequest) {
  const auth = await getRestaurantIdForRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const restaurant = await db.restaurant.findUnique({
      where: { id: auth.restaurantId },
      select: {
        id: true,
        subscription: {
          select: {
            status: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
            plan: true,
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const access = evaluateSubscriptionAccess(restaurant.subscription);
    const plan = restaurant.subscription?.plan ?? null;
    const limits = getPlanFeatures(plan);
    return NextResponse.json(
      {
        data: {
          ...access,
          plan,
          status: restaurant.subscription?.status ?? null,
          trialEndsAt: restaurant.subscription?.trialEndsAt?.toISOString() ?? null,
          currentPeriodEnd: restaurant.subscription?.currentPeriodEnd?.toISOString() ?? null,
          limits: {
            maxBranches: Number.isFinite(limits.maxBranches)
              ? limits.maxBranches
              : null,
            recommendations: limits.recommendations,
            roleBasedSettings: limits.roleBasedSettings,
            branding: limits.branding,
            advancedAnalytics: limits.advancedAnalytics,
          },
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to evaluate subscription access' }, { status: 500 });
  }
}
