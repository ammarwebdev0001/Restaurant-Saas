import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

export const runtime = 'nodejs';

// Customer-facing display layout: 1 featured "very recent" ready order is
// shown big, with 2 additional recent ready orders rendered above it. We
// fetch 3 here and let the client pick the most recent as the featured one.
const COMPLETED_LIMIT = 3;
const IN_PROGRESS_LIMIT = 4;

type DisplayRow = {
  id: string;
  orderId: string;
  status: string;
  startedAt: Date;
  updatedAt: Date;
  selectedMinutes: number;
  shortOrderId: string | null;
  ticketNumber: number | null;
  customerName: string | null;
  customerPhone: string | null;
};

export type OrderDisplayTicket = {
  ticketId: string;
  orderId: string;
  status: 'making' | 'completed';
  startedAt: string;
  updatedAt: string;
  selectedMinutes: number;
  shortOrderId: string | null;
  ticketNumber: number | null;
  customerName: string | null;
  customerPhone: string | null;
};

export type OrderDisplayPayload = {
  data: {
    completed: OrderDisplayTicket[];
    inProgress: OrderDisplayTicket[];
  };
};

/**
 * Customer-facing order display feed.
 *
 * Returns the most recent {@link COMPLETED_LIMIT} completed and
 * {@link IN_PROGRESS_LIMIT} in-progress kitchen tickets for the
 * restaurant the signed-in user is a member of.
 *
 * Auth: signed-in restaurant staff only (no public access — the response
 * contains customer phone numbers).
 */
export async function GET() {
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
      const empty: OrderDisplayPayload = {
        data: { completed: [], inProgress: [] },
      };
      return NextResponse.json(empty, { status: 200 });
    }

    const completedRows = await db.$queryRaw<DisplayRow[]>(
      Prisma.sql`
        SELECT
          kt."id",
          kt."orderId",
          kt."status",
          kt."startedAt",
          kt."updatedAt",
          kt."selectedMinutes",
          o."shortOrderId",
          o."ticketNumber",
          c."name"  AS "customerName",
          c."phone" AS "customerPhone"
        FROM "KitchenTicket" kt
        JOIN "Order" o    ON o."id" = kt."orderId"
        LEFT JOIN "Customer" c ON c."id" = o."customerId"
        WHERE kt."restaurantId" = ${restaurant.id}
          AND lower(kt."status") = 'completed'
        ORDER BY kt."updatedAt" DESC
        LIMIT ${COMPLETED_LIMIT}
      `
    );

    const inProgressRows = await db.$queryRaw<DisplayRow[]>(
      Prisma.sql`
        SELECT
          kt."id",
          kt."orderId",
          kt."status",
          kt."startedAt",
          kt."updatedAt",
          kt."selectedMinutes",
          o."shortOrderId",
          o."ticketNumber",
          c."name"  AS "customerName",
          c."phone" AS "customerPhone"
        FROM "KitchenTicket" kt
        JOIN "Order" o    ON o."id" = kt."orderId"
        LEFT JOIN "Customer" c ON c."id" = o."customerId"
        WHERE kt."restaurantId" = ${restaurant.id}
          AND lower(kt."status") = 'making'
        ORDER BY kt."startedAt" ASC
        LIMIT ${IN_PROGRESS_LIMIT}
      `
    );

    const toTicket = (
      r: DisplayRow,
      status: 'making' | 'completed'
    ): OrderDisplayTicket => ({
      ticketId: r.id,
      orderId: r.orderId,
      status,
      startedAt: r.startedAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      selectedMinutes: r.selectedMinutes,
      shortOrderId: r.shortOrderId,
      ticketNumber: r.ticketNumber,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
    });

    const payload: OrderDisplayPayload = {
      data: {
        completed: completedRows.map((r) => toTicket(r, 'completed')),
        inProgress: inProgressRows.map((r) => toTicket(r, 'making')),
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('order-display get', error);
    return NextResponse.json(
      { error: 'Failed to load order display feed' },
      { status: 500 }
    );
  }
}
