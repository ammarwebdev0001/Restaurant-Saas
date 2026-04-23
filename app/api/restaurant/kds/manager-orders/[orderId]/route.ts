import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

export async function PATCH(
  _req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> }
) {
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
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const { orderId } = await ctx.params;
    if (!orderId) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    const order = await db.order.findFirst({
      where: { id: orderId, restaurantId: restaurant.id },
      select: { id: true, status: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const status = String(order.status ?? '').toLowerCase();
    if (status === 'completed' || status === 'canceled') {
      return NextResponse.json(
        { error: `Order is already ${status}` },
        { status: 409 }
      );
    }

    await db.order.update({
      where: { id: order.id },
      data: { status: 'canceled' },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('kds manager cancel order', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
