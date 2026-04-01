import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { db } from "@/lib/db";

const secret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "dev-nextauth-secret");

export async function getRestaurantForOwnerRequest(req: NextRequest) {
  const token = await getToken({ req, secret });
  const email = (token as { email?: string } | null)?.email;
  if (!email) return { error: "Unauthorized" as const, status: 401 };

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return { error: "User not found" as const, status: 404 };

  const restaurant = await db.restaurant.findFirst({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!restaurant) {
    return { error: "No restaurant found for this account" as const, status: 404 };
  }

  return { restaurant, user };
}
