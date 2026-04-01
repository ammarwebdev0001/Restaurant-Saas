import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { db } from "@/lib/db";

const secret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "dev-nextauth-secret");

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });
    const email = (token as { email?: string } | null)?.email;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    } 

    const restaurant = await db.restaurant.findFirst({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        subdomain: true,
        slug: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: restaurant }, { status: 200 });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant data." },
      { status: 500 }
    );
  }
}

