import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { db } from '@/lib/db';

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    select: { name: true, logoUrl: true },
  });

  const title = restaurant?.name ?? slug;
  const description = restaurant
    ? `Order from ${restaurant.name}.`
    : 'Browse the menu and place your order.';

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
    description,
    ...(icons ? { icons } : {}),
  };
}

export default function WebAppSlugLayout({ children }: { children: ReactNode }) {
  return children;
}
