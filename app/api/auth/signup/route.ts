import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { hashPassword, isStrongPassword } from '@/lib/auth/password';

const ALLOWED_ROLES = ['OWNER', 'WORKER'] as const;

const signupSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required.' })
    .min(2, 'Full name must be at least 2 characters.')
    .max(120, 'Full name must be at most 120 characters.'),
  username: z
    .string({ required_error: 'Username is required.' })
    .min(2, 'Username must be at least 2 characters.')
    .max(60, 'Username must be at most 60 characters.'),
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Enter a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters.')
    .max(200, 'Password must be at most 200 characters.'),
  role: z.enum(ALLOWED_ROLES, {
    errorMap: () => ({
      message: 'Role must be either OWNER or WORKER.',
    }),
  }),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = signupSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, username, email, password, role } = parsed.data;


  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Email is already in use.' },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      name,
      username,
      email,
      password: passwordHash,
      role,
      image: null,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
