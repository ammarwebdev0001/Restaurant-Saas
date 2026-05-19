import type { NextRequest } from "next/server";

import {
  requireRestaurantSession,
  type RestaurantSessionOptions,
} from "@/lib/restaurant/require-session";

export type OwnerRequestOptions = RestaurantSessionOptions;

/**
 * Resolves the dashboard restaurant for the signed-in user: either they own it
 * (`Restaurant.ownerId`) or they are on the team (`Employee` row).
 *
 * @param _req optional — kept for call-site compatibility; session is read from cookies.
 * @param options optional module permission (edit/delete/access).
 */
export async function getRestaurantForOwnerRequest(
  _req?: NextRequest,
  options?: OwnerRequestOptions
) {
  const result = await requireRestaurantSession(options);
  if (!result.ok) {
    const status = result.response.status as 401 | 403 | 404;
    const error =
      status === 401
        ? ("Unauthorized" as const)
        : status === 403
          ? ("Forbidden" as const)
          : ("No restaurant found for this account" as const);
    return { error, status };
  }

  return {
    restaurant: result.ctx.restaurant,
    user: result.ctx.user,
    permissions: result.ctx.permissions,
  };
}
