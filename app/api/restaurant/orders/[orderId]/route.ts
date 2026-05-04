import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

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

    const order = await db.order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurant.id,
      },
      select: {
        id: true,
        shortOrderId: true,
        total: true,
        status: true,
        sourceType: true,
        address: true,
        taxAmount: true,
        discountAmount: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            menuItem: { select: { id: true, name: true } },
            modifiers: {
              select: {
                id: true,
                name: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      payments: order.payments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Failed to load order' },
      { status: 500 }
    );
  }
}
