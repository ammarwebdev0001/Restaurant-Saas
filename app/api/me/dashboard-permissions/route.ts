import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getEffectiveDashboardPermissionNames } from '@/lib/restaurant-roles';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

export async function GET(_req: NextRequest) {
  try {
    const session = await getAppSession();
    const email = session?.user?.email;
    if (!email || typeof email !== 'string') {
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
