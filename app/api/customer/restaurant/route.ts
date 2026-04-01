import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const fromQuery = req.nextUrl.searchParams.get("subdomain");
    const host = (req.headers.get("host") || "").split(":")[0];
    const fromHost = host.endsWith(".localhost")
      ? host.replace(".localhost", "")
      : null;

    const subdomain = fromQuery || fromHost;
    if (!subdomain) {
      return NextResponse.json(
        { error: "Missing subdomain." },
        { status: 400 }
      );
    }

    const restaurant = await db.restaurant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        subdomain: true,
        slug: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { data: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ data: restaurant }, { status: 200 });
  } catch (error) {
    console.error("Error fetching customer restaurant:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant data." },
      { status: 500 }
    );
  }
}

