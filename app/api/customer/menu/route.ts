import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

function getSubdomainFromHost(hostname: string) {
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    if (sub && sub !== 'www') return sub;
    return null;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (rootDomain && hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.slice(0, -(`.${rootDomain}`.length));
    if (sub && sub !== 'www') return sub;
  }

  return null;
}

const menuInclude = {
  orderBy: { name: 'asc' as const },
  select: {
    id: true,
    name: true,
    items: {
      orderBy: { name: 'asc' as const },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        salePrice: true,
        categoryId: true,
        attributeGroups: {
          orderBy: { sortOrder: 'asc' as const },
          select: {
            id: true,
            name: true,
            selectionType: true,
            required: true,
            sortOrder: true,
            linkedCategory: {
              select: {
                id: true,
                name: true,
                items: {
                  orderBy: { name: 'asc' as const },
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    imageUrl: true,
                    price: true,
                    salePrice: true,
                  },
                },
              },
            },
          },
        },
        offersFromThis: {
          orderBy: { sortOrder: 'asc' as const },
          select: {
            id: true,
            sortOrder: true,
            offeredItem: {
              select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                price: true,
                salePrice: true,
              },
            },
          },
        },
      },
    },
  },
} as const;

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')?.trim();
    const fromQuery = req.nextUrl.searchParams.get('subdomain');
    const host = (req.headers.get('host') || '').split(':')[0];
    const fromHost = getSubdomainFromHost(host);

    if (slug) {
      const restaurant = await db.restaurant.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          subdomain: true,
          slug: true,
          menus: menuInclude,
        },
      });
      if (!restaurant) {
        return NextResponse.json({ data: null }, { status: 200 });
      }
      return NextResponse.json({ data: restaurant }, { status: 200 });
    }

    const subdomain = fromQuery || fromHost;

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Missing subdomain or slug.' },
        { status: 400 }
      );
    }

    const restaurant = await db.restaurant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        subdomain: true,
        slug: true,
        menus: menuInclude,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ data: null }, { status: 200 });
    }
    return NextResponse.json({ data: restaurant }, { status: 200 });
  } catch (error) {
    console.error('customer menu', error);
    return NextResponse.json(
      { error: 'Failed to load menu.' },
      { status: 500 }
    );
  }
}
