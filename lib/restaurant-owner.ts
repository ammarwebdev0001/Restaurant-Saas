import type { NextRequest } from 'next/server';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';

export type RestaurantRequestAuth =
  | { ok: true; restaurantId: string; userId: string }
  | { ok: false; status: number; error: string };

/** First restaurant where the user is owner or an employee (via `Employee`). */
export async function getRestaurantForUser(userId: string) {
  return db.restaurant.findFirst({
    where: {
      OR: [{ ownerId: userId }, { employees: { some: { userId } } }],
    },
    orderBy: { createdAt: 'asc' },
  });
}

/** @param _req optional — kept for call-site compatibility; session is read from cookies. */
export async function getRestaurantIdForRequest(
  _req?: NextRequest
): Promise<RestaurantRequestAuth> {
  const session = await getAppSession();
  const email = session?.user?.email;
  if (!email || typeof email !== 'string') {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return { ok: false, status: 404, error: 'User not found' };
  }

  const restaurant = await getRestaurantForUser(user.id);
  if (!restaurant) {
    return { ok: false, status: 404, error: 'Restaurant not found' };
  }

  return { ok: true, restaurantId: restaurant.id, userId: user.id };
}
