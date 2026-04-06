import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { db } from '@/lib/db';

const secret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === 'production' ? undefined : 'dev-nextauth-secret');

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

export async function getRestaurantIdForRequest(
  req: NextRequest
): Promise<RestaurantRequestAuth> {
  const token = await getToken({ req, secret });
  const email = (token as { email?: string } | null)?.email;
  if (!email) {
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
