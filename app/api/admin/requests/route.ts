import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requirePlatformAdmin } from "@/lib/auth/adminRequest";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const requests = await db.$queryRaw<
      Array<{
        id: string;
        name: string;
        email: string;
        restaurantName: string;
        createdAt: Date;
      }>
    >(Prisma.sql`
      SELECT "id","name","email","restaurantName","createdAt"
      FROM "DemoRequest"
      ORDER BY "createdAt" DESC
    `);

    return NextResponse.json(
      { data: requests.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  }
}
