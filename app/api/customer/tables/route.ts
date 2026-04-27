import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')?.trim();
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    const restaurant = await db.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!restaurant) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const rows = await db.diningTable.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, sortOrder: true },
    });

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (error) {
    console.error('customer tables', error);
    return NextResponse.json(
      { error: 'Failed to load tables.' },
      { status: 500 }
    );
  }
}

