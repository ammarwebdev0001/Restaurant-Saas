import type { PrismaClient } from '@prisma/client';

import { DEMO_RESTAURANT_SLUG } from '../lib/demo-restaurant';

/**
 * Idempotent demo tenant: slug/subdomain `restaurant`, menu with categories,
 * items, attribute groups (linked categories), and a combo offer.
 */
export async function seedDemoRestaurant(prisma: PrismaClient): Promise<void> {
  const pendingOwner = await prisma.role.findFirst({
    where: { restaurantId: null, slug: 'pending_owner' },
    select: { id: true },
  });
  if (!pendingOwner) {
    console.warn(
      '[seed-demo] Skipping demo restaurant: global pending_owner role missing. Run full seed first.'
    );
    return;
  }

  let owner = await prisma.user.findUnique({
    where: { email: 'demo-store-owner@local.dev' },
    select: { id: true },
  });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        name: 'Demo Store Owner',
        username: 'demo_store_owner',
        email: 'demo-store-owner@local.dev',
        password: null,
        emailVerified: new Date(),
        roleId: pendingOwner.id,
      },
      select: { id: true },
    });
    console.log('[seed-demo] Created demo owner user');
  }

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: DEMO_RESTAURANT_SLUG },
    create: {
      name: 'Restaurant',
      slug: DEMO_RESTAURANT_SLUG,
      subdomain: DEMO_RESTAURANT_SLUG,
      ownerId: owner.id,
    },
    update: {
      name: 'Restaurant',
      subdomain: DEMO_RESTAURANT_SLUG,
      ownerId: owner.id,
    },
  });

  const rId = restaurant.id;

  await prisma.menuItemOffer.deleteMany({
    where: { baseItem: { restaurantId: rId } },
  });
  await prisma.menuItemAttributeGroup.deleteMany({
    where: { menuItem: { restaurantId: rId } },
  });
  await prisma.menuItem.deleteMany({ where: { restaurantId: rId } });
  await prisma.menuCategory.deleteMany({ where: { restaurantId: rId } });

  const catMains = await prisma.menuCategory.create({
    data: { name: 'Chef specials', restaurantId: rId },
  });
  const catSizes = await prisma.menuCategory.create({
    data: { name: 'Choose size', restaurantId: rId },
  });
  const catAddons = await prisma.menuCategory.create({
    data: { name: 'Add-ons', restaurantId: rId },
  });
  const catDrinks = await prisma.menuCategory.create({
    data: { name: 'Drinks', restaurantId: rId },
  });

  const sizeRegular = await prisma.menuItem.create({
    data: {
      name: 'Regular',
      description: 'Standard portion',
      price: 0,
      salePrice: null,
      categoryId: catSizes.id,
      restaurantId: rId,
    },
  });
  const sizeLarge = await prisma.menuItem.create({
    data: {
      name: 'Large',
      description: 'Upsize',
      price: 2,
      salePrice: null,
      categoryId: catSizes.id,
      restaurantId: rId,
    },
  });

  const addonCheese = await prisma.menuItem.create({
    data: {
      name: 'Extra cheese',
      price: 1.5,
      categoryId: catAddons.id,
      restaurantId: rId,
    },
  });
  const addonBacon = await prisma.menuItem.create({
    data: {
      name: 'Bacon',
      price: 2,
      categoryId: catAddons.id,
      restaurantId: rId,
    },
  });

  const drinkCola = await prisma.menuItem.create({
    data: {
      name: 'Cola',
      description: 'Chilled 33cl',
      price: 2.5,
      categoryId: catDrinks.id,
      restaurantId: rId,
    },
  });

  const burger = await prisma.menuItem.create({
    data: {
      name: 'Classic Burger',
      description: 'House sauce, lettuce, tomato',
      price: 8.99,
      salePrice: 7.99,
      categoryId: catMains.id,
      restaurantId: rId,
    },
  });

  const fries = await prisma.menuItem.create({
    data: {
      name: 'Seasoned fries',
      description: 'Side',
      price: 3.5,
      categoryId: catMains.id,
      restaurantId: rId,
    },
  });

  await prisma.menuItemAttributeGroup.create({
    data: {
      menuItemId: burger.id,
      name: 'Choose size',
      sortOrder: 0,
      selectionType: 'SINGLE',
      required: true,
      linkedCategoryId: catSizes.id,
    },
  });

  await prisma.menuItemAttributeGroup.create({
    data: {
      menuItemId: burger.id,
      name: 'Add-ons',
      sortOrder: 1,
      selectionType: 'MULTIPLE',
      required: false,
      linkedCategoryId: catAddons.id,
    },
  });

  await prisma.menuItemOffer.create({
    data: {
      baseItemId: burger.id,
      offeredItemId: fries.id,
      sortOrder: 0,
    },
  });

  await prisma.menuItemOffer.create({
    data: {
      baseItemId: burger.id,
      offeredItemId: drinkCola.id,
      sortOrder: 1,
    },
  });

  console.log(
    `[seed-demo] Restaurant "${DEMO_RESTAURANT_SLUG}" ready with menu, attributes, and offers.`
  );
}
