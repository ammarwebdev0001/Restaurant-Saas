import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { getRestaurantIdForRequest } from '@/lib/restaurant-owner';
import { RESTAURANT_ROLE_SLUG } from '@/lib/restaurant-roles';
import { getRestaurantPlanFeatures, subscriptionPlanDeniedResponse } from '@/lib/subscription-plan-enforcement';

const patchSchema = z.object({
  roleId: z.string().uuid(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
) {
  const auth = await getRestaurantIdForRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { employeeId } = await context.params;
  if (!employeeId) {
    return NextResponse.json({ error: 'Missing employee id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const restaurant = await db.restaurant.findUnique({
    where: { id: auth.restaurantId },
    select: { ownerId: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
  }

  const employee = await db.employee.findFirst({
    where: { id: employeeId, restaurantId: auth.restaurantId },
    select: { id: true, userId: true, roleId: true },
  });
  if (!employee) {
    return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
  }

  const newRole = await db.role.findFirst({
    where: { id: parsed.data.roleId, restaurantId: auth.restaurantId },
    select: { id: true, slug: true },
  });
  if (!newRole) {
    return NextResponse.json({ error: 'Role not found.' }, { status: 400 });
  }

  const planFeatures = await getRestaurantPlanFeatures(auth.restaurantId);
  if (!planFeatures.roleBasedSettings) {
    const slug = newRole.slug;
    if (slug !== RESTAURANT_ROLE_SLUG.OWNER && slug !== RESTAURANT_ROLE_SLUG.ADMIN) {
      return subscriptionPlanDeniedResponse('Assigning custom roles to team members');
    }
  }

  const ownerRole = await db.role.findUnique({
    where: {
      restaurantId_slug: {
        restaurantId: auth.restaurantId,
        slug: RESTAURANT_ROLE_SLUG.OWNER,
      },
    },
    select: { id: true },
  });

  if (newRole.slug === RESTAURANT_ROLE_SLUG.OWNER) {
    if (employee.userId !== restaurant.ownerId) {
      return NextResponse.json(
        { error: 'Only the restaurant owner can have the Owner role.' },
        { status: 403 }
      );
    }
  }

  if (
    restaurant.ownerId === employee.userId &&
    ownerRole &&
    newRole.id !== ownerRole.id
  ) {
    return NextResponse.json(
      { error: 'The restaurant owner must stay on the Owner role.' },
      { status: 403 }
    );
  }

  await db.employee.update({
    where: { id: employee.id },
    data: { roleId: newRole.id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
) {
  const auth = await getRestaurantIdForRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { employeeId } = await context.params;
  if (!employeeId) {
    return NextResponse.json({ error: 'Missing employee id' }, { status: 400 });
  }

  const restaurant = await db.restaurant.findUnique({
    where: { id: auth.restaurantId },
    select: { ownerId: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
  }

  const employee = await db.employee.findFirst({
    where: { id: employeeId, restaurantId: auth.restaurantId },
    select: { id: true, userId: true },
  });
  if (!employee) {
    return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
  }

  if (employee.userId === restaurant.ownerId) {
    return NextResponse.json(
      { error: 'The restaurant owner cannot be removed from the team.' },
      { status: 403 }
    );
  }

  await db.employee.delete({ where: { id: employee.id } });
  return NextResponse.json({ ok: true });
}
