import type { NextRequest } from "next/server";

import { getAppSession } from "@/lib/auth/app-session";

/**
 * App Router: session from `next/headers` cookies — same path as
 * `/api/auth/session`. Avoid `getToken({ req })` with `NextRequest` in production.
 */
async function sessionFromCookies() {
  return getAppSession();
}

/** @param _req unused — kept so call sites can stay `getSessionEmail(req)` */
export async function getSessionEmail(_req?: NextRequest) {
  const session = await sessionFromCookies();
  const email = session?.user?.email;
  return typeof email === "string" ? email : null;
}

/** @param _req unused — kept so call sites can stay `getSessionUserId(req)` */
export async function getSessionUserId(_req?: NextRequest) {
  const session = await sessionFromCookies();
  const id = session?.user?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}
