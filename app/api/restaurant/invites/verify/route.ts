import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
  }

  const invite = await db.employeeInvite.findUnique({
    where: { token },
    include: {
      restaurant: { select: { name: true } },
      role: { select: { name: true } },
    },
  });

  if (!invite || invite.status !== 'PENDING') {
    return NextResponse.json(
      { error: 'Invalid or already handled invitation.' },
      { status: 404 }
    );
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: 'This invitation has expired.' },
      { status: 410 }
    );
  }

  return NextResponse.json({
    restaurantName: invite.restaurant.name,
    roleName: invite.role.name,
    email: invite.email,
  });
}
