import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/auth/app-session";
import { isPlatformAdmin } from "@/lib/auth/admin";

export async function requirePlatformAdmin(_req?: NextRequest) {
  const session = await getAppSession();
  const email = session?.user?.email ?? null;
  const role = session?.user?.role ?? null;

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isPlatformAdmin(email, role)) {
    return { error: NextResponse.json({ error: "Access Blocked" }, { status: 403 }) };
  }

  return { session, email, role };
}
