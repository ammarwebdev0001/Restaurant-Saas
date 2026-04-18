import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';
import type { SalesOrderRow, SalesOrdersStats } from '@/types/sales-order';

export async function GET(_req: NextRequest) {
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
      const empty: SalesOrderRow[] = [];
      const emptyStats: SalesOrdersStats = {
        online: { count: 0, totalAmount: 0 },
        pos: { count: 0, totalAmount: 0 },
        kiosk: { count: 0, totalAmount: 0 },
        all: { count: 0, totalAmount: 0 },
      };
      return NextResponse.json({
        onlineOrders: empty,
        posOrders: empty,
        kioskOrders: empty,
        stats: emptyStats,
        orders: empty,
      });
    }

    // Prefer raw SQL so `sourceType` works even if `npx prisma generate` was not
    // run after the migration (stale client cannot `select: { sourceType: true }`).
    let fromMenu: SalesOrderRow[];
    try {
      const rows = await db.$queryRaw<
        Array<{
          id: string;
          total: number;
          status: string;
          sourceType: string;
          createdAt: Date;
        }>
      >(Prisma.sql`
        SELECT id, total, status, "sourceType"::text AS "sourceType", "createdAt"
        FROM "Order"
        WHERE "restaurantId" = ${restaurant.id}::uuid
        ORDER BY "createdAt" DESC
      `);
      fromMenu = rows.map((o) => ({
        id: o.id,
        kind: 'menu_order',
        sourceType: o.sourceType,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      }));
    } catch {
      try {
        const menuOrders = await db.order.findMany({
          where: { restaurantId: restaurant.id },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            sourceType: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        fromMenu = menuOrders.map((o) => ({
          id: o.id,
          kind: 'menu_order',
          sourceType: o.sourceType,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        }));
      } catch {
        fromMenu = [];
      }
    }

    let fromSales: SalesOrderRow[];
    try {
      const trows = await db.$queryRaw<
        Array<{
          id: string;
          totalAmount: unknown;
          isComplete: boolean;
          sourceType: string;
          createdAt: Date;
        }>
      >(Prisma.sql`
        SELECT id, "totalAmount", "isComplete", "sourceType"::text AS "sourceType", "createdAt"
        FROM "Transaction"
        WHERE "restaurantId" = ${restaurant.id}::uuid
        ORDER BY "createdAt" DESC
      `);
      fromSales = trows.map((t) => ({
        id: t.id,
        kind: 'sale_transaction',
        sourceType: t.sourceType,
        total:
          t.totalAmount != null ? Number(t.totalAmount as string | number) : null,
        status: t.isComplete ? 'Complete' : 'Open',
        createdAt: t.createdAt.toISOString(),
      }));
    } catch {
      try {
        const saleTransactions = await db.transaction.findMany({
          where: { restaurantId: restaurant.id },
          select: {
            id: true,
            totalAmount: true,
            isComplete: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        fromSales = saleTransactions.map((t) => ({
          id: t.id,
          kind: 'sale_transaction',
          sourceType: 'WALK_IN',
          total: t.totalAmount != null ? Number(t.totalAmount) : null,
          status: t.isComplete ? 'Complete' : 'Open',
          createdAt: t.createdAt.toISOString(),
        }));
      } catch {
        fromSales = [];
      }
    }

    const rowTotal = (r: SalesOrderRow) =>
      r.total != null && !Number.isNaN(r.total) ? r.total : 0;

    const onlineOrders = fromMenu
      .filter((o) => o.sourceType === 'ONLINE')
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    const kioskOrders = fromMenu
      .filter((o) => o.sourceType === 'KIOSK')
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    const posMenuOrders = fromMenu.filter(
      (o) => o.sourceType === 'POS' || o.sourceType === 'OTHER'
    );
    const posOrders = [...posMenuOrders, ...fromSales].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const allMerged = [...fromMenu, ...fromSales];
    const stats: SalesOrdersStats = {
      online: {
        count: onlineOrders.length,
        totalAmount: onlineOrders.reduce((s, r) => s + rowTotal(r), 0),
      },
      pos: {
        count: posOrders.length,
        totalAmount: posOrders.reduce((s, r) => s + rowTotal(r), 0),
      },
      kiosk: {
        count: kioskOrders.length,
        totalAmount: kioskOrders.reduce((s, r) => s + rowTotal(r), 0),
      },
      all: {
        count: allMerged.length,
        totalAmount: allMerged.reduce((s, r) => s + rowTotal(r), 0),
      },
    };

    const orders = [...allMerged].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      onlineOrders,
      posOrders,
      kioskOrders,
      stats,
      orders,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Failed to load sales orders' },
      { status: 500 }
    );
  }
}
