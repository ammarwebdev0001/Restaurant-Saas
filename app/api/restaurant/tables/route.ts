import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { getRestaurantForOwnerRequest } from '@/lib/restaurant/ownerRestaurant';

const postSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export async function GET(_req: NextRequest) {
  const auth = await getRestaurantForOwnerRequest(undefined, {
    moduleKeys: ['tables', 'pos'],
    action: 'access',
  });
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rows = await db.diningTable.findMany({
    where: { restaurantId: auth.restaurant.id },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, sortOrder: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ data: rows }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const auth = await getRestaurantForOwnerRequest(req, {
    moduleKey: 'tables',
    action: 'edit',
  });
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const name = parsed.data.name.trim();
  const sortOrder = parsed.data.sortOrder ?? 0;

  try {
    const created = await db.diningTable.create({
      data: {
        restaurantId: auth.restaurant.id,
        name,
        sortOrder,
      },
      select: { id: true, name: true, sortOrder: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2002') {
      return NextResponse.json(
        { error: 'A table with this name already exists' },
        { status: 409 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}
