import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')?.trim();
  const restaurantSlug = req.nextUrl.searchParams.get('restaurantSlug')?.trim();
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  const baseSelect = {
    id: true,
    shortOrderId: true,
    ticketNumber: true,
    status: true,
    total: true,
    createdAt: true,
    updatedAt: true,
    customer: {
      select: { id: true, name: true, phone: true, email: true },
    },
    payments: {
      orderBy: { createdAt: 'desc' as const },
      select: { id: true, amount: true, status: true, method: true, createdAt: true },
    },
    items: {
      select: {
        id: true,
        quantity: true,
        price: true,
        menuItem: { select: { name: true } },
      },
    },
  };

  const order = await db.order.findFirst({
    where: restaurantSlug
      ? {
          OR: [{ id: orderId }, { shortOrderId: orderId.toUpperCase() }],
          restaurant: { slug: restaurantSlug },
        }
      : { OR: [{ id: orderId }, { shortOrderId: orderId.toUpperCase() }] },
    select: baseSelect,
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: order.id,
      shortOrderId: order.shortOrderId,
      ticketNumber: order.ticketNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customer: order.customer,
      payment: order.payments[0]
        ? {
            ...order.payments[0],
            createdAt: order.payments[0].createdAt.toISOString(),
          }
        : null,
      items: order.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        price: it.price,
        name: it.menuItem.name,
      })),
    },
  });
}
