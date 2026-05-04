import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getRestaurantForOwnerRequest } from "@/lib/restaurant/ownerRestaurant";
import { getRestaurantPlanFeatures, subscriptionPlanDeniedResponse } from "@/lib/subscription-plan-enforcement";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  required: z.boolean().optional(),
  linkedCategoryId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ groupId: string }> }
) {
  const auth = await getRestaurantForOwnerRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const planFeatures = await getRestaurantPlanFeatures(auth.restaurant.id);
  if (!planFeatures.recommendations) {
    return subscriptionPlanDeniedResponse("Recommendation groups (add-on categories)");
  }

  const { groupId } = await ctx.params;

  const group = await db.menuItemAttributeGroup.findFirst({
    where: { id: groupId },
    include: { menuItem: true },
  });
  if (!group || group.menuItem.restaurantId !== auth.restaurant.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  if (parsed.data.linkedCategoryId) {
    const linked = await db.menuCategory.findFirst({
      where: { id: parsed.data.linkedCategoryId, restaurantId: auth.restaurant.id },
    });
    if (!linked) {
      return NextResponse.json({ error: "Invalid linked category" }, { status: 400 });
    }
    if (linked.id === group.menuItem.categoryId) {
      return NextResponse.json(
        { error: "Add-on category must differ from the product category." },
        { status: 400 }
      );
    }
  }

  const updated = await db.menuItemAttributeGroup.update({
    where: { id: groupId },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.selectionType !== undefined ? { selectionType: parsed.data.selectionType } : {}),
      ...(parsed.data.required !== undefined ? { required: parsed.data.required } : {}),
      ...(parsed.data.linkedCategoryId !== undefined
        ? { linkedCategoryId: parsed.data.linkedCategoryId }
        : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
    },
    include: { linkedCategory: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ data: updated }, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ groupId: string }> }
) {
  const auth = await getRestaurantForOwnerRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const planFeatures = await getRestaurantPlanFeatures(auth.restaurant.id);
  if (!planFeatures.recommendations) {
    return subscriptionPlanDeniedResponse("Recommendation groups (add-on categories)");
  }

  const { groupId } = await ctx.params;

  const group = await db.menuItemAttributeGroup.findFirst({
    where: { id: groupId },
    include: { menuItem: true },
  });
  if (!group || group.menuItem.restaurantId !== auth.restaurant.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.menuItemAttributeGroup.delete({ where: { id: groupId } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
