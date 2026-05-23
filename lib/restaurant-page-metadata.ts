import type { Metadata } from 'next';

import { db } from '@/lib/db';
import { buildRestaurantDocumentTitle } from '@/lib/restaurant-document-branding';

export async function metadataForRestaurantSlug(
  slug: string,
  pageSuffix?: string | null
): Promise<Metadata> {
  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    select: { name: true, logoUrl: true },
  });

  const name = restaurant?.name?.trim() || slug;
  const title = buildRestaurantDocumentTitle(name, pageSuffix);
  const logoUrl = restaurant?.logoUrl?.trim();
  const icons =
    logoUrl && logoUrl.length > 0
      ? {
          icon: [{ url: logoUrl }],
          apple: [{ url: logoUrl }],
        }
      : undefined;

  return {
    title,
    description: pageSuffix === 'Kiosk'
      ? `Self-service ordering at ${name}`
      : `Order from ${name}`,
    ...(icons ? { icons } : {}),
  };
}
