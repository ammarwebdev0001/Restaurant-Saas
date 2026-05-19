import type { NextRequest } from 'next/server';

import { db } from '@/lib/db';
import {
  requireRestaurantSession,
  type RestaurantSessionOptions,
} from '@/lib/restaurant/require-session';

export type RestaurantRequestAuth =
  | { ok: true; restaurantId: string; userId: string; permissions: string[] }
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

export type RestaurantIdRequestOptions = RestaurantSessionOptions;

/** @param _req optional — kept for call-site compatibility; session is read from cookies. */
export async function getRestaurantIdForRequest(
  _req?: NextRequest,
  options?: RestaurantIdRequestOptions
): Promise<RestaurantRequestAuth> {
  const result = await requireRestaurantSession(options);
  if (!result.ok) {
    const status = result.response.status;
    const error =
      status === 401
        ? 'Unauthorized'
        : status === 403
          ? 'Forbidden'
          : status === 404
            ? 'Restaurant not found'
            : 'Request failed';
    return { ok: false, status, error };
  }

  return {
    ok: true,
    restaurantId: result.ctx.restaurant.id,
    userId: result.ctx.user.id,
    permissions: result.ctx.permissions,
  };
}
