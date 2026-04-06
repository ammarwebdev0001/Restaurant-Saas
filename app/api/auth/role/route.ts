import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getToken } from "next-auth/jwt";

import { db } from "@/lib/db";
import { GLOBAL_ROLE_SLUG, getGlobalRoleIdBySlug } from "@/lib/global-roles";

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

  let roleId: string | null = null;
  if (role === "OWNER") {
    const id = await getGlobalRoleIdBySlug(GLOBAL_ROLE_SLUG.PENDING_OWNER);
    if (!id) {
      return NextResponse.json(
        { error: "Pending Owner role is missing. Run migrations." },
        { status: 503 }
      );
    }
    roleId = id;
  } else if (role === "WORKER") {
    const id = await getGlobalRoleIdBySlug(GLOBAL_ROLE_SLUG.PENDING_WORKER);
    if (!id) {
      return NextResponse.json(
        { error: "Pending Worker role is missing. Run migrations." },
        { status: 503 }
      );
    }
    roleId = id;
  }

  await db.user.update({
    where: { email: tokenEmail },
    data: { roleId },
  });

  return NextResponse.json({ ok: true, role });
}
