import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

const updateBranchSchema = z.object({
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

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ branchId: string }> }
) {
  try {
    const auth = await resolveRestaurantId();
    if ('error' in auth) return auth.error;

    const { branchId } = await ctx.params;
    const json = await req.json().catch(() => null);
    const parsed = updateBranchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await db.branch.updateMany({
      where: {
        id: branchId,
        restaurantId: auth.restaurantId,
      },
      data: {
        name: parsed.data.name.trim(),
        address: parsed.data.address?.trim() || null,
        phone: parsed.data.phone?.trim() || null,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const branch = await db.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: branch }, { status: 200 });
  } catch (error) {
    console.error('update restaurant branch', error);
    return NextResponse.json(
      { error: 'Failed to update branch.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ branchId: string }> }
) {
  try {
    const auth = await resolveRestaurantId();
    if ('error' in auth) return auth.error;

    const { branchId } = await ctx.params;
    const totalBranches = await db.branch.count({
      where: { restaurantId: auth.restaurantId },
    });
    if (totalBranches <= 1) {
      return NextResponse.json(
        { error: 'You must keep at least one branch.' },
        { status: 400 }
      );
    }

    const deleted = await db.branch.deleteMany({
      where: {
        id: branchId,
        restaurantId: auth.restaurantId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('delete restaurant branch', error);
    return NextResponse.json(
      { error: 'Failed to delete branch.' },
      { status: 500 }
    );
  }
}
