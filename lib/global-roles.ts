import { db } from '@/lib/db';

/** Platform-wide roles (`Role.restaurantId` is null). */
export const GLOBAL_ROLE_SLUG = {
  PLATFORM_ADMIN: 'platform_admin',
  PENDING_OWNER: 'pending_owner',
  PENDING_WORKER: 'pending_worker',
} as const;

/** Global roles shown on `/register` (seed: name Owner + User). */
export const REGISTER_ROLE_SLUG = {
  OWNER: 'seed_owner',
  USER: 'customer_user',
} as const;

export async function getGlobalRoleIdBySlug(
  slug: string
): Promise<string | null> {
  const r = await db.role.findFirst({
    where: { restaurantId: null, slug },
    select: { id: true },
  });
  return r?.id ?? null;
}
