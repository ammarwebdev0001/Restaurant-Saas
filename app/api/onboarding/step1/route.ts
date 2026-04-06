import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getSessionEmail, getSessionUserId } from "@/lib/onboarding/auth";
import { legacyRoleFromAccountRole } from "@/lib/auth/account-role";
import { ensurePresetRolesAndOwnerEmployee } from "@/lib/restaurant-roles";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  subdomain: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        "Domain must be lowercase letters, numbers, and single hyphens only.",
    }),
});

function slugifySubdomain(raw: string) {
  return raw.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail(req);
  const userId = await getSessionUserId(req);
  if (!email || !userId) {
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
    return NextResponse.json(
      { error: "Only restaurant owners can complete onboarding." },
      { status: 403 }
    );
  }

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const subdomain = slugifySubdomain(parsed.data.subdomain);
  const name = parsed.data.name.trim();

  const existingOwned = await db.restaurant.findFirst({
    where: { ownerId: user.id },
  });
  if (existingOwned) {
    return NextResponse.json(
      {
        restaurant: existingOwned,
        message: "You already have a restaurant.",
      },
      { status: 200 }
    );
  }

  const taken = await db.restaurant.findFirst({
    where: {
      OR: [{ slug: subdomain }, { subdomain }],
    },
  });
  if (taken) {
    return NextResponse.json(
      { error: "That domain name is already taken. Try another." },
      { status: 409 }
    );
  }

  const restaurant = await db.restaurant.create({
    data: {
      name,
      slug: subdomain,
      subdomain,
      ownerId: user.id,
    },
  });

  await ensurePresetRolesAndOwnerEmployee(restaurant.id, user.id);

  return NextResponse.json({ restaurant });
}
