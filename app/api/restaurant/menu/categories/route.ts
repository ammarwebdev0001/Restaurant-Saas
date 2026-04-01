import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getRestaurantForOwnerRequest } from "@/lib/restaurant/ownerRestaurant";

const bodySchema = z.object({
  name: z.string().min(1, "Category name is required").max(120),
});

export async function POST(req: NextRequest) {
  const auth = await getRestaurantForOwnerRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const cat = await db.menuCategory.create({
      data: {
        name: parsed.data.name.trim(),
        restaurantId: auth.restaurant.id,
      },
    });
    return NextResponse.json({ data: cat }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
