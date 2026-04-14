import { OrderSourceType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

function parseSourceType(v: unknown): OrderSourceType {
  if (v === 'POS' || v === 'ONLINE' || v === 'WALK_IN' || v === 'OTHER') {
    return v;
  }
  return OrderSourceType.WALK_IN;
}

async function generateUniqueTransactionId(): Promise<string> {
  let isUnique = false;
  let customId = '';
  while (!isUnique) {
    customId = `TRS-${uuidv4().slice(0, 8)}`;
    const existing = await db.transaction.findUnique({
      where: { id: customId },
    });
    if (!existing) isUnique = true;
  }
  return customId;
}

export const POST = async (request: Request) => {
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
      return NextResponse.json(
        { error: 'No restaurant found for this account' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const sourceType = parseSourceType(body?.sourceType);
    const totalAmountRaw = body?.totalAmount;
    const markComplete = Boolean(body?.markComplete);

    const totalAmount =
      typeof totalAmountRaw === 'number' && !Number.isNaN(totalAmountRaw)
        ? totalAmountRaw
        : typeof totalAmountRaw === 'string'
          ? parseFloat(totalAmountRaw)
          : null;

    const customId = await generateUniqueTransactionId();

    const newOrder = await db.transaction.create({
      data: {
        id: customId,
        restaurantId: restaurant.id,
        sourceType,
        isComplete: markComplete && totalAmount != null && !Number.isNaN(totalAmount),
        totalAmount:
          markComplete && totalAmount != null && !Number.isNaN(totalAmount)
            ? totalAmount
            : null,
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
