import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { REGISTER_ROLE_SLUG } from '@/lib/global-roles';

/**
 * Roles offered on the public register form: global rows whose name is Owner or User
 * (seed `seed_owner` / `customer_user`), scoped by slug so only those presets appear.
 */
export async function GET() {
  const slugs = Object.values(REGISTER_ROLE_SLUG);

  const roles = await db.role.findMany({
    where: {
      restaurantId: null,
      slug: { in: slugs },
      OR: [
        { name: { equals: 'Owner', mode: 'insensitive' } },
        { name: { equals: 'User', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ roles });
}
