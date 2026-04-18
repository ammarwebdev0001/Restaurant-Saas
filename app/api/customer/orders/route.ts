import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { OrderSourceType } from '@prisma/client';
import { z } from 'zod';

import { db } from '@/lib/db';

const SERVICE_FEE = 0.99;
const SELECTED_MINUTES_ONLINE = 30;

const modifierSelectionSchema = z.object({
  menuItemId: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.number().finite().nonnegative(),
});

const modifierGroupSchema = z.object({
  attributeGroupId: z.string(),
  groupName: z.string(),
  selections: z.array(modifierSelectionSchema),
});

const lineSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  /** Per-unit line price (base + modifiers), same convention as POS `OrderItem.price`. */
  unitPrice: z.number().finite().nonnegative(),
  productName: z.string().min(1),
  modifiers: z.array(modifierGroupSchema).default([]),
});

const orderInfoSchema = z.object({
  mode: z.enum(['delivery', 'pickUp']),
  restaurantName: z.string().optional(),
  storeId: z.string().optional(),
  storeName: z.string().optional(),
  storeAddress: z.string().optional(),
  address: z.string().optional(),
  apartment: z.string().optional(),
  gateCode: z.string().optional(),
  addressName: z.string().optional(),
  restaurantSlug: z.string().optional(),
});

const postSchema = z.object({
  restaurantSlug: z.string().min(1).max(200),
  orderType: z.enum(['delivery', 'pickUp']),
  orderInfo: orderInfoSchema,
  lines: z.array(lineSchema).min(1).max(200),
  subtotal: z.number().finite().nonnegative(),
  total: z.number().finite().nonnegative(),
  cutlery: z.boolean(),
  comment: z.string().max(2000).optional(),
});

function buildAddressSnapshot(
  orderType: 'delivery' | 'pickUp',
  info: z.infer<typeof orderInfoSchema>,
  cutlery: boolean,
  comment?: string
): string {
  const lines: string[] = ['Source: Online', `Fulfillment: ${orderType === 'delivery' ? 'Delivery' : 'Pick-up'}`];

  if (info.restaurantName?.trim()) {
    lines.push(`Restaurant: ${info.restaurantName.trim()}`);
  }

  if (orderType === 'delivery') {
    if (info.addressName?.trim()) lines.push(`Name: ${info.addressName.trim()}`);
    if (info.address?.trim()) lines.push(`Address: ${info.address.trim()}`);
    if (info.apartment?.trim()) lines.push(`Apartment / door: ${info.apartment.trim()}`);
    if (info.gateCode?.trim()) lines.push(`Gate code: ${info.gateCode.trim()}`);
  } else {
    if (info.storeName?.trim()) lines.push(`Pickup location: ${info.storeName.trim()}`);
    if (info.storeAddress?.trim()) lines.push(`Store address: ${info.storeAddress.trim()}`);
  }

  lines.push(`Cutlery requested: ${cutlery ? 'yes' : 'no'}`);
  if (comment?.trim()) {
    lines.push(`Customer note: ${comment.trim()}`);
  }

  return lines.join('\n');
}

function ticketProductName(
  productName: string,
  groups: z.infer<typeof modifierGroupSchema>[]
): string {
  if (!groups.length) return productName;
  const bits = groups.map((g) => {
    const names = g.selections.map((s) => s.name).join(', ');
    return `${g.groupName}: ${names}`;
  });
  return `${productName} (${bits.join('; ')})`;
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { restaurantSlug, orderType, orderInfo, lines, subtotal, total, cutlery, comment } =
    parsed.data;

  const slug = restaurantSlug.trim();
  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const computedSubtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  if (Math.abs(computedSubtotal - subtotal) > 0.02) {
    return NextResponse.json({ error: 'Subtotal does not match cart lines' }, { status: 400 });
  }

  const computedTotal = computedSubtotal + SERVICE_FEE;
  if (Math.abs(computedTotal - total) > 0.02) {
    return NextResponse.json({ error: 'Total does not match subtotal plus service fee' }, { status: 400 });
  }

  const menuIds = new Set<string>();
  for (const line of lines) {
    menuIds.add(line.menuItemId);
    for (const g of line.modifiers) {
      for (const s of g.selections) {
        menuIds.add(s.menuItemId);
      }
    }
  }

  const menuRows = await db.menuItem.findMany({
    where: { restaurantId: restaurant.id, id: { in: [...menuIds] } },
    select: { id: true },
  });
  if (menuRows.length !== menuIds.size) {
    return NextResponse.json({ error: 'One or more menu items are invalid for this restaurant' }, { status: 400 });
  }

  const addressSnapshot = buildAddressSnapshot(orderType, orderInfo, cutlery, comment);

  try {
    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          restaurantId: restaurant.id,
          customerId: null,
          status: 'pending',
          total: computedTotal,
          sourceType: OrderSourceType.ONLINE,
          address: addressSnapshot || null,
          taxAmount: 0,
          discountAmount: 0,
        },
      });

      for (const line of lines) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: line.menuItemId,
            quantity: line.quantity,
            price: line.unitPrice,
          },
        });

        const flatMods = line.modifiers.flatMap((g) => g.selections);
        if (flatMods.length > 0) {
          await tx.orderItemModifier.createMany({
            data: flatMods.map((s) => ({
              orderItemId: orderItem.id,
              menuItemId: s.menuItemId,
              name: s.name,
              unitPrice: s.unitPrice,
              quantity: 1,
            })),
          });
        }
      }

      const ticket = await tx.kitchenTicket.create({
        data: {
          restaurantId: restaurant.id,
          orderId: order.id,
          status: 'pending',
          selectedMinutes: SELECTED_MINUTES_ONLINE,
        },
      });

      await tx.kitchenTicketItem.createMany({
        data: lines.map((line) => ({
          kitchenTicketId: ticket.id,
          productName: ticketProductName(line.productName, line.modifiers),
          quantity: line.quantity,
        })),
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: computedTotal,
          status: 'completed',
          method: 'Online checkout',
          restaurantId: restaurant.id,
        },
      });

      return order;
    });

    return NextResponse.json(
      { data: { orderId: result.id, restaurantId: restaurant.id } },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
