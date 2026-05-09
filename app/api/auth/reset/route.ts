import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { createResetToken } from "@/lib/auth/resetToken";
import { sendResetPasswordEmail } from "@/lib/email/reset-password";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return NextResponse.json(
      { error: "User not exist for this email." },
      { status: 404 }
    );
  }

  const token = createResetToken(normalizedEmail);
  const mail = await sendResetPasswordEmail({
    to: normalizedEmail,
    token,
  });
  if (!mail.ok) {
    return NextResponse.json({ error: mail.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Reset link sent to your email.",
  });
}

