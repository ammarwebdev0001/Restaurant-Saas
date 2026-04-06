import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth-options";

/**
 * App Router: resolve session via `next/headers` cookies — same path as the
 * `/api/auth/session` handler. `getToken({ req })` with `NextRequest` often
 * returns null in production builds.
 */
async function sessionFromCookies() {
  return getServerSession(authOptions);
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
