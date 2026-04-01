import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getRestaurantForOwnerRequest } from "@/lib/restaurant/ownerRestaurant";

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  categoryId: z.string().uuid(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  price: z.number().positive(),
  salePrice: z.number().positive().optional().nullable(),
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

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const category = await db.menuCategory.findFirst({
    where: { id: parsed.data.categoryId, restaurantId: auth.restaurant.id },
  });
  if (!category) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const imageUrl =
    parsed.data.imageUrl && parsed.data.imageUrl.length > 0 ? parsed.data.imageUrl : null;
  const description =
    parsed.data.description && parsed.data.description.length > 0
      ? parsed.data.description
      : null;
  const salePrice =
    parsed.data.salePrice != null && parsed.data.salePrice > 0
      ? parsed.data.salePrice
      : null;

  try {
    const item = await db.menuItem.create({
      data: {
        name: parsed.data.name.trim(),
        description,
        imageUrl,
        price: parsed.data.price,
        salePrice,
        categoryId: parsed.data.categoryId,
        restaurantId: auth.restaurant.id,
      },
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
