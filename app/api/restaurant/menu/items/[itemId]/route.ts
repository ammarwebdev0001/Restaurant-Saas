import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getRestaurantForOwnerRequest } from "@/lib/restaurant/ownerRestaurant";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  categoryId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  price: z.number().positive().optional(),
  salePrice: z.number().positive().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> }
) {
  const auth = await getRestaurantForOwnerRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { itemId } = await ctx.params;

  const existing = await db.menuItem.findFirst({
    where: { id: itemId, restaurantId: auth.restaurant.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.categoryId) {
    const cat = await db.menuCategory.findFirst({
      where: { id: parsed.data.categoryId, restaurantId: auth.restaurant.id },
    });
    if (!cat) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
  }

  const imageUrl =
    parsed.data.imageUrl !== undefined
      ? parsed.data.imageUrl && parsed.data.imageUrl.length > 0
        ? parsed.data.imageUrl
        : null
      : undefined;

  const description =
    parsed.data.description !== undefined
      ? parsed.data.description && parsed.data.description.length > 0
        ? parsed.data.description
        : null
      : undefined;

  const salePrice =
    parsed.data.salePrice !== undefined
      ? parsed.data.salePrice != null && parsed.data.salePrice > 0
        ? parsed.data.salePrice
        : null
      : undefined;

  const updated = await db.menuItem.update({
    where: { id: itemId },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(parsed.data.categoryId !== undefined ? { categoryId: parsed.data.categoryId } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
      ...(salePrice !== undefined ? { salePrice } : {}),
    },
  });

  return NextResponse.json({ data: updated }, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> }
) {
  const auth = await getRestaurantForOwnerRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { itemId } = await ctx.params;

  const existing = await db.menuItem.findFirst({
    where: { id: itemId, restaurantId: auth.restaurant.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await db.menuItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
