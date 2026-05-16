import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { OrderSourceType } from '@prisma/client';

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
      where: {
        id: orderId,
        restaurantId: restaurant.id,
        sourceType: OrderSourceType.POS,
      },
      select: {
        id: true,
        status: true,
        kitchenTickets: {
          where: { status: { equals: 'making', mode: 'insensitive' } },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const status = String(order.status ?? '').toLowerCase();
    if (status === 'completed' || status === 'canceled' || status === 'cancelled') {
      return NextResponse.json(
        { error: `Order is already ${status}` },
        { status: 409 }
      );
    }

    if (order.kitchenTickets.length > 0) {
      return NextResponse.json(
        { error: 'Order is already on the kitchen display and cannot be canceled here.' },
        { status: 409 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'canceled' },
      });
      await tx.kitchenTicket.updateMany({
        where: {
          orderId: order.id,
          status: { in: ['pending', 'making'] },
        },
        data: { status: 'canceled' },
      });
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('pos order cancel', e);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
