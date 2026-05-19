import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { OrderSourceType } from '@prisma/client';

import { db } from '@/lib/db';
import { getRestaurantIdForRequest } from '@/lib/restaurant-owner';

/**
 * POS orders paid/saved but not yet on the kitchen display (no ticket in "making").
 */
export async function GET(_req: NextRequest) {
  try {
    const auth = await getRestaurantIdForRequest(_req, {
      moduleKey: 'pos',
      action: 'access',
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const orders = await db.order.findMany({
      where: {
        restaurantId: auth.restaurantId,
        sourceType: OrderSourceType.POS,
        status: { in: ['pending', 'pedding'] },
        kitchenTickets: {
          none: {
            status: { equals: 'making', mode: 'insensitive' },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        shortOrderId: true,
        ticketNumber: true,
        total: true,
        status: true,
        tableLabel: true,
        createdAt: true,
        customer: { select: { name: true, phone: true } },
        items: {
          select: {
            quantity: true,
            menuItem: { select: { name: true } },
          },
        },
        payments: {
          select: { method: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const data = orders.map((o) => ({
      id: o.id,
      shortOrderId: o.shortOrderId,
      ticketNumber: o.ticketNumber,
      total: o.total,
      status: o.status,
      tableLabel: o.tableLabel,
      createdAt: o.createdAt.toISOString(),
      customerName: o.customer?.name ?? null,
      customerPhone: o.customer?.phone ?? null,
      paymentMethod: o.payments[0]?.method ?? null,
      items: o.items.map((it) => ({
        quantity: it.quantity,
        name: it.menuItem.name,
      })),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    console.error('pos pending-kitchen', e);
    return NextResponse.json(
      { error: 'Failed to load pending kitchen orders' },
      { status: 500 }
    );
  }
}
