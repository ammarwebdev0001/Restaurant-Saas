import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "dev-nextauth-secret");

export async function getSessionEmail(req: NextRequest) {
  const token = await getToken({ req, secret });
  const email = (token as { email?: string } | null)?.email;
  return typeof email === "string" ? email : null;
}

export async function getSessionUserId(req: NextRequest) {
  const token = await getToken({ req, secret });
  const id = (token as { id?: string; sub?: string } | null)?.id;
  const sub = (token as { sub?: string } | null)?.sub;
  return id ?? sub ?? null;
}
