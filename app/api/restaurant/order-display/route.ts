import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';
import { getOrderDisplayTimezone } from '@/lib/order-display-timezone';

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
    /** YYYY-MM-DD — calendar date used for the "today" filter in {@link filterTimezone}. */
    filterDate: string;
    /** IANA zone used to compute "today" (from `ORDER_DISPLAY_TIMEZONE`, default UTC). */
    filterTimezone: string;
  };
};

/**
 * Customer-facing order display feed.
 *
 * Returns the most recent {@link COMPLETED_LIMIT} completed and
 * {@link IN_PROGRESS_LIMIT} in-progress kitchen tickets for **orders
 * placed today** (calendar day of `Order.createdAt` in
 * `ORDER_DISPLAY_TIMEZONE`, default UTC) so daily token numbers stay
 * consistent on the wall display.
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

    const tz = getOrderDisplayTimezone();
    const [dateRow] = await db.$queryRaw<{ filterDate: Date | string }[]>(
      Prisma.sql`
        SELECT (timezone(${tz}::text, now()))::date AS "filterDate"
      `
    );
    const rawFd = dateRow?.filterDate;
    const filterDateStr =
      typeof rawFd === 'string'
        ? rawFd.slice(0, 10)
        : rawFd instanceof Date && !Number.isNaN(rawFd.getTime())
          ? rawFd.toISOString().slice(0, 10)
          : '';

    const restaurant = await getRestaurantForUser(user.id);
    if (!restaurant) {
      const empty: OrderDisplayPayload = {
        data: {
          completed: [],
          inProgress: [],
          filterDate: filterDateStr,
          filterTimezone: tz,
        },
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
          AND (timezone(${tz}::text, o."createdAt"))::date
              = (timezone(${tz}::text, now()))::date
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
          AND (timezone(${tz}::text, o."createdAt"))::date
              = (timezone(${tz}::text, now()))::date
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
        filterDate: filterDateStr,
        filterTimezone: tz,
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
