import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth-options";

/**
 * Session for App Router Route Handlers & RSC: reads cookies via `next/headers`.
 * Prefer this over `getToken({ req })` with `NextRequest`, which often returns null in production.
 */
export function getAppSession() {
  return getServerSession(authOptions);
}
