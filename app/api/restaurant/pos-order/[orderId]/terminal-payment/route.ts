import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

type UpdateStatus = 'completed' | 'failed' | 'cancelled' | 'pending';

function normalizeStatus(value: unknown): UpdateStatus | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v === 'completed' || v === 'failed' || v === 'cancelled' || v === 'pending') {
    return v;
  }
  return null;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
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
      return NextResponse.json(
        { error: 'No restaurant found for this account' },
        { status: 400 }
      );
    }

    const { orderId } = await context.params;
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const status = normalizeStatus(body?.status);
    if (!status) {
      return NextResponse.json(
        { error: 'Invalid status. Use completed, failed, cancelled, or pending.' },
        { status: 400 }
      );
    }

    const amountNum = Number(body?.amount);
    const amount = Number.isFinite(amountNum) && amountNum >= 0 ? amountNum : undefined;
    const terminalTransactionId =
      typeof body?.terminalTransactionId === 'string'
        ? body.terminalTransactionId.trim()
        : '';

    const order = await db.order.findFirst({
      where: { id: orderId, restaurantId: restaurant.id },
      select: { id: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const latestPayment = await db.payment.findFirst({
      where: { orderId: order.id, restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const method =
      terminalTransactionId.length > 0
        ? `Card Terminal (${terminalTransactionId})`
        : 'Card Terminal';

    if (latestPayment) {
      await db.payment.update({
        where: { id: latestPayment.id },
        data: {
          status,
          method,
          ...(amount !== undefined ? { amount } : {}),
        },
      });
    } else {
      await db.payment.create({
        data: {
          orderId: order.id,
          restaurantId: restaurant.id,
          amount: amount ?? 0,
          status,
          method,
        },
      });
    }

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update terminal payment status' },
      { status: 500 }
    );
  }
}
