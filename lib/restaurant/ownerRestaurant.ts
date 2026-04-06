import type { NextRequest } from "next/server";

import { getAppSession } from "@/lib/auth/app-session";
import { db } from "@/lib/db";
import { getRestaurantForUser } from "@/lib/restaurant-owner";

/**
 * Resolves the dashboard restaurant for the signed-in user: either they own it
 * (`Restaurant.ownerId`) or they are on the team (`Employee` row). `User` has
 * no `restaurantId` column; the link is always through those relations.
 *
 * @param _req optional — kept for call-site compatibility; session is read from cookies.
 */
export async function getRestaurantForOwnerRequest(_req?: NextRequest) {
  const session = await getAppSession();
  const email = session?.user?.email;
  if (!email || typeof email !== "string") {
    return { error: "Unauthorized" as const, status: 401 };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return { error: "User not found" as const, status: 404 };

  const restaurant = await getRestaurantForUser(user.id);

  if (!restaurant) {
    return {
      error: "No restaurant found for this account" as const,
      status: 404,
    };
  }

  return { restaurant, user };
}
