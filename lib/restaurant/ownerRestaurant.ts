import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { db } from "@/lib/db";
import { getRestaurantForUser } from "@/lib/restaurant-owner";

const secret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "dev-nextauth-secret");

/**
 * Resolves the dashboard restaurant for the signed-in user: either they own it
 * (`Restaurant.ownerId`) or they are on the team (`Employee` row). `User` has
 * no `restaurantId` column; the link is always through those relations.
 */
export async function getRestaurantForOwnerRequest(req: NextRequest) {
  const token = await getToken({ req, secret });
  const email = (token as { email?: string } | null)?.email;
  if (!email) return { error: "Unauthorized" as const, status: 401 };

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return { error: "User not found" as const, status: 404 };

  const restaurant = await getRestaurantForUser(user.id);

  if (!restaurant) {
    return { error: "No restaurant found for this account" as const, status: 404 };
  }

  return { restaurant, user };
}
