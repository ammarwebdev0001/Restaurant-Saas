import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAppSession } from "@/lib/auth/app-session";
import { db } from "@/lib/db";
import { estimateDataUrlBytes, isAcceptedImageValue } from "@/lib/image-data-url";
import { ensurePresetRolesAndOwnerEmployee } from "@/lib/restaurant-roles";
import { getRestaurantForUser } from "@/lib/restaurant-owner";
import { normalizeThemePrimaryColor } from "@/lib/restaurant-theme";
import { getRestaurantPlanFeatures, subscriptionPlanDeniedResponse } from "@/lib/subscription-plan-enforcement";

function assertHttpUrl(label: string, raw: string, ctx: z.RefinementCtx, path: (string | number)[]) {
  const t = raw.trim();
  if (!t) return;
  if (!isAcceptedImageValue(t)) {
    ctx.addIssue({
      code: "custom",
      message: `${label} must be an http/https URL or base64 image`,
      path,
    });
    return;
  }
  if (t.startsWith("data:image/")) {
    const bytes = estimateDataUrlBytes(t);
    if (bytes > 2 * 1024 * 1024) {
      ctx.addIssue({
        code: "custom",
        message: `${label} base64 image must be <= 2MB`,
        path,
      });
    }
  }
}

const brandingPatchSchema = z
  .object({
    logoUrl: z.string().max(2_800_000).optional(),
    mainBannerUrl: z.string().max(2_800_000).optional(),
    menuBannerUrls: z.array(z.string().max(2_800_000)).max(20).optional(),
    themePrimaryColor: z.string().max(32).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.logoUrl !== undefined) {
      assertHttpUrl("Logo URL", val.logoUrl, ctx, ["logoUrl"]);
    }
    if (val.mainBannerUrl !== undefined) {
      assertHttpUrl("Main banner URL", val.mainBannerUrl, ctx, ["mainBannerUrl"]);
    }
    if (val.menuBannerUrls) {
      val.menuBannerUrls.forEach((line, i) => {
        assertHttpUrl("Menu banner URL", line, ctx, ["menuBannerUrls", i]);
      });
    }
    if (val.themePrimaryColor !== undefined) {
      const normalized = normalizeThemePrimaryColor(val.themePrimaryColor);
      if (val.themePrimaryColor.trim() !== "" && !normalized) {
        ctx.addIssue({
          code: "custom",
          message: "Theme primary color must be a hex color like #ea580c",
          path: ["themePrimaryColor"],
        });
      }
    }
  });

export async function GET(_req: NextRequest) {
  try {
    const session = await getAppSession();
    const email = session?.user?.email;
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    } 

    const restaurant = await getRestaurantForUser(user.id);
    if (!restaurant) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const full = await db.restaurant.findUnique({
      where: { id: restaurant.id },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        mainBannerUrl: true,
        menuBannerUrls: true,
        themePrimaryColor: true,
        subdomain: true,
        slug: true,
        ownerId: true,
      },
    });

    if (full?.ownerId === user.id) {
      await ensurePresetRolesAndOwnerEmployee(full.id, user.id);
    }

    return NextResponse.json({ data: full }, { status: 200 });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant data." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAppSession();
    const email = session?.user?.email;
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const restaurant = await getRestaurantForUser(user.id);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const planFeatures = await getRestaurantPlanFeatures(restaurant.id);

    const json = await req.json().catch(() => null);
    const parsed = brandingPatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { logoUrl, mainBannerUrl, menuBannerUrls, themePrimaryColor } = parsed.data;
    if (!planFeatures.branding) {
      if (
        logoUrl !== undefined ||
        mainBannerUrl !== undefined ||
        menuBannerUrls !== undefined ||
        themePrimaryColor !== undefined
      ) {
        return subscriptionPlanDeniedResponse("Custom logo, banners, and theme colors");
      }
    }
    if (
      logoUrl === undefined &&
      mainBannerUrl === undefined &&
      menuBannerUrls === undefined &&
      themePrimaryColor === undefined
    ) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 }
      );
    }

    const data: {
      logoUrl?: string | null;
      mainBannerUrl?: string | null;
      menuBannerUrls?: string[];
      themePrimaryColor?: string | null;
    } = {};

    if (logoUrl !== undefined) {
      data.logoUrl = logoUrl.trim() === "" ? null : logoUrl.trim();
    }
    if (mainBannerUrl !== undefined) {
      data.mainBannerUrl =
        mainBannerUrl.trim() === "" ? null : mainBannerUrl.trim();
    }
    if (menuBannerUrls !== undefined) {
      data.menuBannerUrls = menuBannerUrls
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    if (themePrimaryColor !== undefined) {
      const normalized = normalizeThemePrimaryColor(themePrimaryColor);
      data.themePrimaryColor = normalized ?? null;
    }

    const updated = await db.restaurant.update({
      where: { id: restaurant.id },
      data,
      select: {
        id: true,
        name: true,
        logoUrl: true,
        mainBannerUrl: true,
        menuBannerUrls: true,
        themePrimaryColor: true,
        subdomain: true,
        slug: true,
        ownerId: true,
      },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return NextResponse.json(
      { error: "Failed to update restaurant." },
      { status: 500 }
    );
  }
}
