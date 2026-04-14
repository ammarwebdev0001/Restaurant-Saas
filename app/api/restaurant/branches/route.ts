import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
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
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const branches = await db.branch.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: branches }, { status: 200 });
  } catch (error) {
    console.error('restaurant branches', error);
    return NextResponse.json(
      { error: 'Failed to load branches.' },
      { status: 500 }
    );
  }
}
