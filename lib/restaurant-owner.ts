import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { db } from '@/lib/db';

const secret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === 'production' ? undefined : 'dev-nextauth-secret');

export async function getRestaurantIdForRequest(
  req: NextRequest
): Promise<
  | { ok: true; restaurantId: string }
  | { ok: false; status: number; error: string }
> {
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

  const restaurant = await db.restaurant.findFirst({
    where: { ownerId: user.id },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!restaurant) {
    return { ok: false, status: 404, error: 'Restaurant not found' };
  }

  return { ok: true, restaurantId: restaurant.id };
}
