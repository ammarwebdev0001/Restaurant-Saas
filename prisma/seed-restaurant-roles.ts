import type { PrismaClient } from '@prisma/client';

import { allRestaurantOwnerPermissionNames } from './seed-roles';

export const RESTAURANT_PRESET_ROLE_SLUG = {
  OWNER: 'owner',
  ADMIN: 'admin',
} as const;

async function replaceRolePermissions(
  prisma: PrismaClient,
  roleId: string,
  permissionNames: string[]
) {
  await prisma.permission.deleteMany({ where: { roleId } });
  if (permissionNames.length > 0) {
    await prisma.permission.createMany({
      data: permissionNames.map((name) => ({ name, roleId })),
    });
  }
}

/** Owner/Admin preset roles with access, edit, and delete on every dashboard module. */
export async function upsertRestaurantPresetRole(
  prisma: PrismaClient,
  restaurantId: string,
  slug: (typeof RESTAURANT_PRESET_ROLE_SLUG)[keyof typeof RESTAURANT_PRESET_ROLE_SLUG],
  displayName: string
): Promise<{ id: string }> {
  const full = allRestaurantOwnerPermissionNames();

  const existing = await prisma.role.findUnique({
    where: {
      restaurantId_slug: { restaurantId, slug },
    },
    select: { id: true },
  });

  if (existing) {
    await replaceRolePermissions(prisma, existing.id, full);
    return existing;
  }

  return prisma.role.create({
    data: {
      restaurantId,
      name: displayName,
      slug,
      permissions: {
        create: full.map((name) => ({ name })),
      },
    },
    select: { id: true },
  });
}

/** Idempotent: preset roles, employee row, and user.roleId for the account owner. */
export async function ensureRestaurantOwnerEmployee(
  prisma: PrismaClient,
  restaurantId: string,
  ownerUserId: string
): Promise<void> {
  const ownerRole = await upsertRestaurantPresetRole(
    prisma,
    restaurantId,
    RESTAURANT_PRESET_ROLE_SLUG.OWNER,
    'Owner'
  );
  await upsertRestaurantPresetRole(
    prisma,
    restaurantId,
    RESTAURANT_PRESET_ROLE_SLUG.ADMIN,
    'Admin'
  );

  await prisma.employee.upsert({
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

  await prisma.user.update({
    where: { id: ownerUserId },
    data: { roleId: ownerRole.id },
  });
}

/** Re-apply full dashboard permissions on every restaurant Owner preset role. */
export async function refreshAllRestaurantOwnerRoles(
  prisma: PrismaClient
): Promise<void> {
  const full = allRestaurantOwnerPermissionNames();
  const roles = await prisma.role.findMany({
    where: {
      restaurantId: { not: null },
      slug: RESTAURANT_PRESET_ROLE_SLUG.OWNER,
    },
    select: { id: true, restaurantId: true },
  });

  for (const role of roles) {
    await replaceRolePermissions(prisma, role.id, full);
  }

  if (roles.length > 0) {
    console.log(
      `[seed] Refreshed ${full.length} permissions on ${roles.length} restaurant Owner role(s)`
    );
  }
}

/** Ensure each restaurant has Owner/Admin presets and the account owner is on Owner. */
export async function ensureAllRestaurantsOwnerRoles(
  prisma: PrismaClient
): Promise<void> {
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, ownerId: true },
  });

  for (const { id, ownerId } of restaurants) {
    await ensureRestaurantOwnerEmployee(prisma, id, ownerId);
  }

  if (restaurants.length > 0) {
    console.log(
      `[seed] Ensured Owner preset + employee for ${restaurants.length} restaurant(s)`
    );
  }
}
