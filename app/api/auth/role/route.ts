import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getToken } from "next-auth/jwt";

import { db } from "@/lib/db";

const roleSchema = z.enum(["OWNER", "WORKER", "UNKNOW"]);

export async function POST(req: NextRequest) {
  const token = await getToken({
    req,
    secret:
      process.env.NEXTAUTH_SECRET ??
      (process.env.NODE_ENV === "production"
        ? undefined
        : "dev-nextauth-secret"),
  });

  const tokenEmail = (token as any)?.email;
  if (!tokenEmail || typeof tokenEmail !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = roleSchema.safeParse(json?.role);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const role = parsed.data;

  await db.user.update({
    where: { email: tokenEmail },
    data: { role },
  });

  return NextResponse.json({ ok: true, role });
}

