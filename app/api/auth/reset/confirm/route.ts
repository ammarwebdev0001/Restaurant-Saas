import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { hashPassword, isStrongPassword } from "@/lib/auth/password";
import { verifyResetToken } from "@/lib/auth/resetToken";

const confirmSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = confirmSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  const payload = verifyResetToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired reset token." },
      { status: 400 }
    );
  }

  if (!isStrongPassword(password)) {
    return NextResponse.json(
      { error: "Password is too weak (min 8 characters)." },
      { status: 400 }
    );
  }

  const { email } = payload;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "User not found." },
      { status: 404 }
    );
  }

  const passwordHash = await hashPassword(password);

  await db.user.update({
    where: { email },
    data: {
      password: passwordHash,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

