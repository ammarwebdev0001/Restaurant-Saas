import { NextResponse } from 'next/server';

import type { DashboardModuleKey, PermissionAction } from '@/constant/dashboardModules';
import { getAppSession } from '@/lib/auth/app-session';
import {
  hasAnyDashboardPermission,
  hasDashboardPermission,
  permissionName,
} from '@/lib/dashboard-permissions';
import { db } from '@/lib/db';
import { getEffectiveDashboardPermissionNames } from '@/lib/restaurant-roles';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

export type RestaurantSessionContext = {
  user: { id: string; email: string };
  restaurant: NonNullable<Awaited<ReturnType<typeof getRestaurantForUser>>>;
  permissions: string[];
};

export type RestaurantSessionResult =
  | { ok: true; ctx: RestaurantSessionContext }
  | { ok: false; response: NextResponse };

export type RestaurantSessionOptions = {
  /** Single module permission check. */
  moduleKey?: DashboardModuleKey;
  /** Any of these modules satisfies the check (e.g. POS may read menu via `pos` or `product`). */
  moduleKeys?: DashboardModuleKey[];
  action?: PermissionAction;
};

function checkModulePermission(
  permissions: string[],
  options: RestaurantSessionOptions
): boolean {
  const action = options.action ?? 'access';
  if (options.moduleKeys?.length) {
    return hasAnyDashboardPermission(permissions, options.moduleKeys, action);
  }
  if (options.moduleKey) {
    return hasDashboardPermission(permissions, options.moduleKey, action);
  }
  return true;
}

export async function requireRestaurantSession(
  options?: RestaurantSessionOptions
): Promise<RestaurantSessionResult> {
  const session = await getAppSession();
  const email = session?.user?.email;
  if (!email || typeof email !== 'string') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user?.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'User not found' }, { status: 404 }),
    };
  }

  const restaurant = await getRestaurantForUser(user.id);
  if (!restaurant) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No restaurant found for this account' },
        { status: 404 }
      ),
    };
  }

  const permissions = await getEffectiveDashboardPermissionNames(
    user.id,
    restaurant.id
  );

  if (options && (options.moduleKey || options.moduleKeys?.length)) {
    const action = options.action ?? 'access';
    if (!checkModulePermission(permissions, options)) {
      const label =
        options.moduleKeys?.length
          ? options.moduleKeys.map((k) => permissionName(k, action)).join(' or ')
          : permissionName(options.moduleKey!, action);
      return {
        ok: false,
        response: NextResponse.json(
          { error: `Forbidden: missing ${label} permission` },
          { status: 403 }
        ),
      };
    }
  }

  return {
    ok: true,
    ctx: {
      user: { id: user.id, email: user.email },
      restaurant,
      permissions,
    },
  };
}
