import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { legacyRoleFromAccountRole } from "@/lib/auth/account-role";
import { db } from "@/lib/db";
import { getSessionEmail } from "@/lib/onboarding/auth";

const bodySchema = z.object({
  restaurantId: z.string().min(1),
  logoUrl: z.string().url().optional().or(z.literal("")),
  mainBannerUrl: z.string().url().optional().or(z.literal("")),
  menuBannerUrls: z.array(z.string().url()).max(20).optional(),
});

export async function PATCH(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      accountRole: { select: { slug: true, name: true, restaurantId: true } },
    },
  });
  if (
    !user ||
    legacyRoleFromAccountRole(user.accountRole ?? null) !== "OWNER"
  ) {
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

  const { restaurantId, logoUrl, mainBannerUrl, menuBannerUrls } =
    parsed.data;

  const restaurant = await db.restaurant.findFirst({
    where: { id: restaurantId, ownerId: user.id },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const updated = await db.restaurant.update({
    where: { id: restaurantId },
    data: {
      logoUrl: logoUrl === "" ? null : logoUrl ?? undefined,
      mainBannerUrl: mainBannerUrl === "" ? null : mainBannerUrl ?? undefined,
      menuBannerUrls:
        menuBannerUrls !== undefined ? menuBannerUrls : undefined,
    },
  });

  return NextResponse.json({ restaurant: updated });
}
