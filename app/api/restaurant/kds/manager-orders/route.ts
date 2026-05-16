import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { OrderSourceType } from '@prisma/client';

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
    if (!restaurant) return NextResponse.json({ data: [] }, { status: 200 });

    const pending = await db.order.findMany({
      where: {
        restaurantId: restaurant.id,
        status: { in: ['pending', 'pedding'] },
        // POS sends straight to kitchen after checkout; not queued here.
        sourceType: { not: OrderSourceType.POS },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        // Daily token number + 6-char tracking id used by KDS / customer display.
        ticketNumber: true,
        shortOrderId: true,
        status: true,
        total: true,
        sourceType: true,
        createdAt: true,
        customer: { select: { name: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            menuItem: { select: { name: true } },
            modifiers: { select: { name: true, quantity: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: pending }, { status: 200 });
  } catch (error) {
    console.error('kds manager orders', error);
    return NextResponse.json(
      { error: 'Failed to load pending orders' },
      { status: 500 }
    );
  }
}
