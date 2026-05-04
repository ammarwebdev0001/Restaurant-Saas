import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';

export function parseOrderIdempotencyKey(req: NextRequest): string | null {
  const raw = req.headers.get('x-idempotency-key');
  if (typeof raw !== 'string') return null;
  const t = raw.trim().slice(0, 80);
  return t.length ? t : null;
}

export function jsonPlacedOrder(
  restaurantId: string,
  order: { id: string; shortOrderId: string; ticketNumber: number | null },
  status: 200 | 201 = 201
) {
  return NextResponse.json(
    {
      data: {
        orderId: order.id,
        shortOrderId: order.shortOrderId,
        restaurantId,
        ticketNumber: order.ticketNumber,
      },
    },
    { status }
  );
}

export async function respondIfIdempotentOrderExists(
  idempotencyKey: string | null,
  restaurantId: string
): Promise<NextResponse | null> {
  if (!idempotencyKey) return null;
  const existing = await db.order.findFirst({
    where: { idempotencyKey },
    select: {
      id: true,
      shortOrderId: true,
      restaurantId: true,
      ticketNumber: true,
    },
  });
  if (!existing) return null;
  if (existing.restaurantId !== restaurantId) {
    return NextResponse.json({ error: 'Invalid idempotency key' }, { status: 400 });
  }
  return jsonPlacedOrder(restaurantId, existing, 200);
}

export function isPrismaUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}

export async function recoverOrderFromIdempotencyConflict(
  idempotencyKey: string | null,
  restaurantId: string
): Promise<NextResponse | null> {
  if (!idempotencyKey) return null;
  const existing = await db.order.findFirst({
    where: { idempotencyKey },
    select: {
      id: true,
      shortOrderId: true,
      restaurantId: true,
      ticketNumber: true,
    },
  });
  if (!existing || existing.restaurantId !== restaurantId) return null;
  return jsonPlacedOrder(restaurantId, existing, 200);
}
