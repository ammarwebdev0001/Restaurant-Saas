import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getSessionEmail } from "@/lib/onboarding/auth";

const branchSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
});

const bodySchema = z.object({
  restaurantId: z.string().min(1),
  branches: z.array(branchSchema).max(50),
});

export async function POST(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { restaurantId, branches } = parsed.data;

  const restaurant = await db.restaurant.findFirst({
    where: { id: restaurantId, ownerId: user.id },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  if (branches.length === 0) {
    return NextResponse.json({ ok: true, branches: [] });
  }

  await db.branch.createMany({
    data: branches.map((b) => ({
      restaurantId,
      name: b.name.trim(),
      address: b.address?.trim() || null,
      phone: b.phone?.trim() || null,
    })),
  });

  const created = await db.branch.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, branches: created });
}
