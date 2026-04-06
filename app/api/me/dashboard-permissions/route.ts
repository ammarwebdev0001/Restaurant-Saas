import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { db } from '@/lib/db';
import { getEffectiveDashboardPermissionNames } from '@/lib/restaurant-roles';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

const secret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === 'production' ? undefined : 'dev-nextauth-secret');

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });
    const email = (token as { email?: string } | null)?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const restaurant = await getRestaurantForUser(user.id);
    if (!restaurant) {
      return NextResponse.json({ permissions: [] });
    }

    const permissions = await getEffectiveDashboardPermissionNames(
      user.id,
      restaurant.id
    );

    return NextResponse.json({ permissions });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Failed to load permissions' },
      { status: 500 }
    );
  }
}
