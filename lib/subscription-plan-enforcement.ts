import { SubscriptionPlan } from '@prisma/client';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getPlanFeatures, type PlanFeatureMatrix } from '@/lib/subscription-plan-features';

export type { PlanFeatureMatrix } from '@/lib/subscription-plan-features';

export async function getRestaurantPlanFeatures(
  restaurantId: string
): Promise<PlanFeatureMatrix> {
  const sub = await db.restaurantSubscription.findUnique({
    where: { restaurantId },
    select: { plan: true },
  });
  return getPlanFeatures(sub?.plan ?? SubscriptionPlan.STARTER);
}

export function subscriptionPlanDeniedResponse(featureLabel: string) {
  return NextResponse.json(
    {
      error: `${featureLabel} is not included on your current plan. Upgrade to Growth or Scale from Pricing.`,
    },
    { status: 403 }
  );
}
