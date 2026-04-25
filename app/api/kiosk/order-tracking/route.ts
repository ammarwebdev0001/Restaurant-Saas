import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { OrderSourceType } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')?.trim();
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: {
      id: orderId,
      sourceType: OrderSourceType.KIOSK,
    },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: { id: true, name: true, phone: true, email: true },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, amount: true, status: true, method: true, createdAt: true },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          menuItem: { select: { name: true } },
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
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  let ticketNumber: number | null = null;
  try {
    const rows = await db.$queryRaw<Array<{ ticketNumber: number | null }>>(
      Prisma.sql`SELECT "ticketNumber" FROM "Order" WHERE id = ${orderId}::uuid LIMIT 1`
    );
    ticketNumber = rows[0]?.ticketNumber ?? null;
  } catch {
    ticketNumber = null;
  }

  return NextResponse.json({
    data: {
      id: order.id,
      ticketNumber,
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
        modifiers: it.modifiers.map((m) => ({
          id: m.id,
          name: m.name,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
        })),
      })),
    },
  });
}
