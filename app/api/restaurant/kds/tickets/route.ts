import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

const MIN_PREP_MINUTES = 1;
const MAX_PREP_MINUTES = 240;

function parsePrepMinutes(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const m = Math.round(n);
  if (m < MIN_PREP_MINUTES || m > MAX_PREP_MINUTES) return null;
  return m;
}

type TicketRow = {
  id: string;
  orderId: string;
  status: string;
  selectedMinutes: number;
  startedAt: Date;
  createdAt: Date;
  sourceType: string;
  orderTotal: number;
  customerName: string | null;
  // Daily token number + 6-char tracking id (`Order.ticketNumber` /
  // `Order.shortOrderId`). Surfaced on the kitchen screen so the cook and
  // the customer-facing display reference the same identifiers.
  shortOrderId: string | null;
  ticketNumber: number | null;
};

type TicketItemRow = {
  id: string;
  kitchenTicketId: string;
  productName: string;
  quantity: number;
};

export async function GET(req: NextRequest) {
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
    if (!restaurant) return NextResponse.json({ data: [] }, { status: 200 });

    const requestedStatus = req.nextUrl.searchParams.get('status')?.trim().toLowerCase();
    const statusFilter =
      requestedStatus && ['making', 'completed', 'canceled'].includes(requestedStatus)
        ? requestedStatus
        : 'making';

    const rows = await db.$queryRaw<TicketRow[]>(
      Prisma.sql`
        SELECT
          kt."id",
          kt."orderId",
          kt."status",
          kt."selectedMinutes",
          kt."startedAt",
          kt."createdAt",
          o."sourceType"::text AS "sourceType",
          o."total" AS "orderTotal",
          o."shortOrderId",
          o."ticketNumber",
          c."name" AS "customerName"
        FROM "KitchenTicket" kt
        JOIN "Order" o ON o."id" = kt."orderId"
        LEFT JOIN "Customer" c ON c."id" = o."customerId"
        WHERE kt."restaurantId" = ${restaurant.id}
          AND lower(kt."status") = ${statusFilter}
        ORDER BY kt."createdAt" DESC
      `
    );

    const ticketIds = rows.map((r) => r.id);
    const itemRows =
      ticketIds.length > 0
        ? await db.$queryRaw<TicketItemRow[]>(
            Prisma.sql`
              SELECT "id", "kitchenTicketId", "productName", "quantity"
              FROM "KitchenTicketItem"
              WHERE "kitchenTicketId" IN (${Prisma.join(ticketIds)})
              ORDER BY "id" ASC
            `
          )
        : [];

    const itemsByTicket = new Map<string, TicketItemRow[]>();
    for (const it of itemRows) {
      const arr = itemsByTicket.get(it.kitchenTicketId) ?? [];
      arr.push(it);
      itemsByTicket.set(it.kitchenTicketId, arr);
    }

    const data = rows.map((r) => ({
      ...r,
      startedAt: r.startedAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      items: itemsByTicket.get(r.id) ?? [],
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('kds tickets get', error);
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
    const selectedMinutes = parsePrepMinutes(body?.selectedMinutes);
    if (!orderId) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }
    if (selectedMinutes === null) {
      return NextResponse.json(
        {
          error: `Prep time must be between ${MIN_PREP_MINUTES} and ${MAX_PREP_MINUTES} minutes`,
        },
        { status: 400 }
      );
    }

    const order = await db.order.findFirst({
      where: { id: orderId, restaurantId: restaurant.id },
      select: {
        id: true,
        items: {
          select: {
            quantity: true,
            menuItem: { select: { name: true } },
            modifiers: { select: { name: true, quantity: true } },
          },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const existing = await db.$queryRaw<{ id: string; status: string }[]>(
      Prisma.sql`
        SELECT "id", "status"
        FROM "KitchenTicket"
        WHERE "orderId" = ${orderId}
          AND lower("status") IN ('pending', 'making')
        LIMIT 1
      `
    );
    if (existing.length > 0) {
      const activeTicket = existing[0];
      if (String(activeTicket.status).toLowerCase() === 'making') {
        return NextResponse.json({ error: 'Order already in making' }, { status: 409 });
      }

      await db.$transaction(async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`
            UPDATE "KitchenTicket"
            SET "status" = 'making',
                "selectedMinutes" = ${selectedMinutes},
                "startedAt" = now(),
                "updatedAt" = now()
            WHERE "id" = ${activeTicket.id}
          `
        );
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'making' },
        });
      });

      return NextResponse.json({ data: { id: activeTicket.id } }, { status: 200 });
    }

    const ticketId = `kds_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO "KitchenTicket"
            ("id","restaurantId","orderId","status","selectedMinutes","startedAt","createdAt","updatedAt")
          VALUES
            (${ticketId}, ${restaurant.id}, ${order.id}, 'making', ${selectedMinutes}, now(), now(), now())
        `
      );

      for (const line of order.items) {
        const itemId = `kdsi_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "KitchenTicketItem"
              ("id","kitchenTicketId","productName","quantity")
            VALUES
              (${itemId}, ${ticketId}, ${line.menuItem.name}, ${line.quantity})
          `
        );

        for (const mod of line.modifiers) {
          const modName = String(mod.name || '').trim();
          if (!modName) continue;
          const modId = `kdsi_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
          await tx.$executeRaw(
            Prisma.sql`
              INSERT INTO "KitchenTicketItem"
                ("id","kitchenTicketId","productName","quantity")
              VALUES
                (${modId}, ${ticketId}, ${`+ ${modName}`}, ${mod.quantity})
            `
          );
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'making' },
      });
    });

    return NextResponse.json({ data: { id: ticketId } }, { status: 201 });
  } catch (error) {
    console.error('kds tickets post', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
