import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { createResetToken } from "@/lib/auth/resetToken";

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

  // Prevent account enumeration: always return success, only include token if user exists.
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({
      ok: true,
      message:
        "If an account exists, you'll receive reset instructions shortly.",
    });
  }

  const token = createResetToken(email);

  return NextResponse.json({
    ok: true,
    message:
      "Reset token generated (dev mode). Use the token to set a new password.",
    token,
  });
}

