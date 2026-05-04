import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';
import { getRestaurantPlanFeatures } from '@/lib/subscription-plan-enforcement';

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function lastNDayKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)
    );
    keys.push(utcDayKey(d));
  }
  return keys;
}

async function resolveRestaurantId() {
  const session = await getAppSession();
  const email = session?.user?.email;
  if (!email || typeof email !== 'string') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  const restaurant = await getRestaurantForUser(user.id);
  if (!restaurant) {
    return { error: NextResponse.json({ error: 'Restaurant not found' }, { status: 404 }) };
  }

  return { restaurantId: restaurant.id };
}

export async function GET(_req: NextRequest) {
  try {
    const auth = await resolveRestaurantId();
    if ('error' in auth) return auth.error;

    const { restaurantId } = auth;
    const planFeatures = await getRestaurantPlanFeatures(restaurantId);
    const dayKeys = lastNDayKeys(7);
    const from = new Date(`${dayKeys[0]}T00:00:00.000Z`);

    const [
      branches,
      categories,
      menuItems,
      ordersTotal,
      posOrders,
      customers,
      recommendations,
      kdsOpen,
      employees,
      ordersWindow,
    ] = await Promise.all([
      db.branch.count({ where: { restaurantId } }),
      db.menuCategory.count({ where: { restaurantId } }),
      db.menuItem.count({ where: { restaurantId } }),
      db.order.count({ where: { restaurantId } }),
      db.order.count({ where: { restaurantId, sourceType: 'POS' } }),
      db.customer.count({ where: { restaurantId } }),
      db.menuItemOffer.count({
        where: { baseItem: { restaurantId } } },
      ),
      db.kitchenTicket.count({
        where: {
          restaurantId,
          status: { notIn: ['completed', 'canceled'] },
        },
      }),
      db.employee.count({ where: { restaurantId } }),
      db.order.findMany({
        where: { restaurantId, createdAt: { gte: from } },
        select: { createdAt: true, total: true },
      }),
    ]);

    const byDay = new Map<string, { orders: number; revenue: number }>();
    for (const k of dayKeys) {
      byDay.set(k, { orders: 0, revenue: 0 });
    }
    for (const row of ordersWindow) {
      const k = utcDayKey(new Date(row.createdAt));
      const bucket = byDay.get(k);
      if (!bucket) continue;
      bucket.orders += 1;
      bucket.revenue += Number(row.total) || 0;
    }

    const series = dayKeys.map((day) => {
      const b = byDay.get(day)!;
      return { day, orders: b.orders, revenue: b.revenue };
    });

    if (!planFeatures.advancedAnalytics) {
      return NextResponse.json({
        counts: {
          branches,
          categories,
          menuItems,
          orders: ordersTotal,
          posOrders: 0,
          customers: 0,
          recommendations: 0,
          kdsOpen: 0,
          employees: 0,
        },
        series: [],
        analyticsTier: 'basic' as const,
      });
    }

    return NextResponse.json({
      counts: {
        branches,
        categories,
        menuItems,
        orders: ordersTotal,
        posOrders,
        customers,
        recommendations,
        kdsOpen,
        employees,
      },
      series,
      analyticsTier: 'advanced' as const,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Failed to load dashboard analytics' },
      { status: 500 }
    );
  }
}
