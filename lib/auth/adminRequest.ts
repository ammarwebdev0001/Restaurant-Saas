import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { isPlatformAdmin } from "@/lib/auth/admin";

const secret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "dev-nextauth-secret");

export async function requirePlatformAdmin(req: NextRequest) {
  const token = await getToken({ req, secret });
  const email = (token as { email?: string } | null)?.email;
  const role = (token as { role?: string } | null)?.role;

  if (!token || (!email && !token.sub)) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!isPlatformAdmin(email, role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { token, email: email ?? null, role: role ?? null };
}
