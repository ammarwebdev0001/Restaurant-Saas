import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/auth/app-session";
import { db } from "@/lib/db";
import { ensurePresetRolesAndOwnerEmployee } from "@/lib/restaurant-roles";
import { getRestaurantForUser } from "@/lib/restaurant-owner";

export async function GET(_req: NextRequest) {
  try {
    const session = await getAppSession();
    const email = session?.user?.email;
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    } 

    const restaurant = await getRestaurantForUser(user.id);
    if (!restaurant) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const full = await db.restaurant.findUnique({
      where: { id: restaurant.id },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        subdomain: true,
        slug: true,
        ownerId: true,
      },
    });

    if (full?.ownerId === user.id) {
      await ensurePresetRolesAndOwnerEmployee(full.id, user.id);
    }

    return NextResponse.json({ data: full }, { status: 200 });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant data." },
      { status: 500 }
    );
  }
}

