import { DASHBOARD_MODULES, PERMISSION_ACTIONS } from '@/constant/dashboardModules';
import {
  normalizeDashboardPermissions,
  permissionName,
} from '@/lib/dashboard-permissions';
import { db } from '@/lib/db';

/** Preset slugs stored in `Role.slug` (per restaurant). */
export const RESTAURANT_ROLE_SLUG = {
  OWNER: 'owner',
  ADMIN: 'admin',
} as const;

export type RestaurantRoleSlug =
  (typeof RESTAURANT_ROLE_SLUG)[keyof typeof RESTAURANT_ROLE_SLUG];

/** All dashboard module permissions (access + edit + delete for each module). */
export function allRestaurantDashboardPermissionNames(): string[] {
  const tokens: string[] = [];
  for (const m of DASHBOARD_MODULES) {
    for (const a of PERMISSION_ACTIONS) {
      tokens.push(permissionName(m.moduleKey, a));
    }
  }
  return normalizeDashboardPermissions(tokens);
}

/**
 * Ensures preset "Owner" and "Admin" roles exist with full dashboard permissions,
 * and assigns the creating user to the Owner role via Employee.
 * Safe to call multiple times (idempotent).
 */
export async function ensurePresetRolesAndOwnerEmployee(
  restaurantId: string,
  ownerUserId: string
): Promise<void> {
  const full = allRestaurantDashboardPermissionNames();

  let ownerRole = await db.role.findUnique({
    where: {
      restaurantId_slug: {
        restaurantId,
        slug: RESTAURANT_ROLE_SLUG.OWNER,
      },
    },
  });
  if (!ownerRole) {
    ownerRole = await db.role.create({
      data: {
        restaurantId,
        name: 'Owner',
        slug: RESTAURANT_ROLE_SLUG.OWNER,
        permissions: {
          create: full.map((name) => ({ name })),
        },
      },
    });
  }

  const adminExists = await db.role.findUnique({
    where: {
      restaurantId_slug: {
        restaurantId,
        slug: RESTAURANT_ROLE_SLUG.ADMIN,
      },
    },
  });
  if (!adminExists) {
    await db.role.create({
      data: {
        restaurantId,
        name: 'Admin',
        slug: RESTAURANT_ROLE_SLUG.ADMIN,
        permissions: {
          create: full.map((name) => ({ name })),
        },
      },
    });
  }

  await db.employee.upsert({
    where: {
      userId_restaurantId: {
        userId: ownerUserId,
        restaurantId,
      },
    },
    create: {
      userId: ownerUserId,
      restaurantId,
      roleId: ownerRole.id,
    },
    update: {
      roleId: ownerRole.id,
    },
  });

  await db.user.update({
    where: { id: ownerUserId },
    data: { roleId: ownerRole.id },
  });
}

export async function getEffectiveDashboardPermissionNames(
  userId: string,
  restaurantId: string
): Promise<string[]> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { ownerId: true },
  });
  if (!restaurant) return [];

  const employee = await db.employee.findUnique({
    where: {
      userId_restaurantId: { userId, restaurantId },
    },
    include: {
      role: {
        include: { permissions: { select: { name: true } } },
      },
    },
  });

  if (employee) {
    return employee.role.permissions.map((p) => p.name);
  }

  if (restaurant.ownerId === userId) {
    return allRestaurantDashboardPermissionNames();
  }

  return [];
}

export function canAccessDashboardModule(
  permissionNames: string[],
  moduleKey: string
): boolean {
  return (
    permissionNames.includes(permissionName(moduleKey, 'access')) ||
    permissionNames.includes(permissionName(moduleKey, 'edit')) ||
    permissionNames.includes(permissionName(moduleKey, 'delete'))
  );
}
