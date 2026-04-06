import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';

import { db } from '@/lib/db';

const secret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === 'production' ? undefined : 'dev-nextauth-secret');

const bodySchema = z.object({
  token: z.string().min(16),
});

export async function POST(req: NextRequest) {
  const session = await getToken({ req, secret });
  const userId =
    typeof session?.sub === 'string' && session.sub.length > 0
      ? session.sub
      : null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const invite = await db.employeeInvite.findUnique({
    where: { token: parsed.data.token },
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

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user?.email) {
    return NextResponse.json(
      { error: 'Your account has no email; cannot accept this invite.' },
      { status: 403 }
    );
  }

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      {
        error:
          'Sign in with the same email address the invitation was sent to.',
      },
      { status: 403 }
    );
  }

  const existing = await db.employee.findUnique({
    where: {
      userId_restaurantId: {
        userId: user.id,
        restaurantId: invite.restaurantId,
      },
    },
  });
  if (existing) {
    await db.employeeInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });
    return NextResponse.json({ ok: true, alreadyMember: true });
  }

  await db.$transaction(async (tx) => {
    await tx.employee.create({
      data: {
        restaurantId: invite.restaurantId,
        userId: user.id,
        roleId: invite.roleId,
      },
    });
    await tx.employeeInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });
  });

  return NextResponse.json({ ok: true });
}
