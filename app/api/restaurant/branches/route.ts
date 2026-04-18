import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

const createBranchSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z.string().trim().max(60).optional().or(z.literal('')),
});

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

    const branches = await db.branch.findMany({
      where: { restaurantId: auth.restaurantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: branches }, { status: 200 });
  } catch (error) {
    console.error('restaurant branches', error);
    return NextResponse.json(
      { error: 'Failed to load branches.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveRestaurantId();
    if ('error' in auth) return auth.error;

    const json = await req.json().catch(() => null);
    const parsed = createBranchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const branch = await db.branch.create({
      data: {
        restaurantId: auth.restaurantId,
        name: parsed.data.name.trim(),
        address: parsed.data.address?.trim() || null,
        phone: parsed.data.phone?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: branch }, { status: 201 });
  } catch (error) {
    console.error('create restaurant branch', error);
    return NextResponse.json(
      { error: 'Failed to create branch.' },
      { status: 500 }
    );
  }
}
