import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getRestaurantForOwnerRequest } from "@/lib/restaurant/ownerRestaurant";
import { getRestaurantPlanFeatures, subscriptionPlanDeniedResponse } from "@/lib/subscription-plan-enforcement";

const createSchema = z
  .object({
    name: z.string().min(1).max(120),
    selectionType: z.enum(["SINGLE", "MULTIPLE"]),
    required: z.boolean().optional(),
    linkedCategoryId: z.string().uuid(),
    sortOrder: z.number().int().min(0).optional(),
    minItems: z.number().int().min(0).nullable().optional(),
    maxItems: z.number().int().min(1).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.selectionType === "MULTIPLE") {
      if (data.minItems == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "minItems is required for multiple selection",
          path: ["minItems"],
        });
      }
      if (data.maxItems == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "maxItems is required for multiple selection",
          path: ["maxItems"],
        });
      }
      if (
        data.minItems != null &&
        data.maxItems != null &&
        data.maxItems < data.minItems
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "maxItems must be greater than or equal to minItems",
          path: ["maxItems"],
        });
      }
    }
  });

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> }
) {
  const auth = await getRestaurantForOwnerRequest(req, {
    moduleKey: "recommendations",
    action: "edit",
  });
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const planFeatures = await getRestaurantPlanFeatures(auth.restaurant.id);
  if (!planFeatures.recommendations) {
    return subscriptionPlanDeniedResponse("Recommendation groups (add-on categories)");
  }

  const { itemId } = await ctx.params;

  const item = await db.menuItem.findFirst({
    where: { id: itemId, restaurantId: auth.restaurant.id },
  });
  if (!item) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
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

  const linked = await db.menuCategory.findFirst({
    where: { id: parsed.data.linkedCategoryId, restaurantId: auth.restaurant.id },
  });
  if (!linked) {
    return NextResponse.json({ error: "Linked category must belong to your restaurant" }, { status: 400 });
  }

  if (linked.id === item.categoryId) {
    return NextResponse.json(
      { error: "Choose a different category than the product's own category for add-ons." },
      { status: 400 }
    );
  }

  const duplicate = await db.menuItemAttributeGroup.findFirst({
    where: {
      menuItemId: itemId,
      linkedCategoryId: parsed.data.linkedCategoryId,
    },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      {
        error:
          "This category is already assigned as a recommendation for this product.",
      },
      { status: 400 }
    );
  }

  const isMultiple = parsed.data.selectionType === "MULTIPLE";

  const group = await db.menuItemAttributeGroup.create({
    data: {
      menuItemId: itemId,
      name: parsed.data.name.trim(),
      selectionType: parsed.data.selectionType,
      required: parsed.data.required ?? false,
      linkedCategoryId: parsed.data.linkedCategoryId,
      sortOrder: parsed.data.sortOrder ?? 0,
      ...(isMultiple
        ? {
            minItems: parsed.data.minItems!,
            maxItems: parsed.data.maxItems!,
          }
        : {}),
    },
    include: {
      linkedCategory: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: group }, { status: 201 });
}
