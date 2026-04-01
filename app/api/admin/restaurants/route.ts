import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/auth/adminRequest";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const restaurants = await db.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        logoUrl: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription: true,
        _count: {
          select: { orders: true, menuItems: true },
        },
      },
    });

    return NextResponse.json({ data: restaurants });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load restaurants" }, { status: 500 });
  }
}
