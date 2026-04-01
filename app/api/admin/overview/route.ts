import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/auth/adminRequest";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const [restaurantCount, activeSubs, trialSubs] = await Promise.all([
      db.restaurant.count(),
      db.restaurantSubscription.count({ where: { status: "ACTIVE" } }),
      db.restaurantSubscription.count({ where: { status: "TRIAL" } }),
    ]);

    return NextResponse.json({
      data: {
        restaurantCount,
        activeSubscriptions: activeSubs,
        trialSubscriptions: trialSubs,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
