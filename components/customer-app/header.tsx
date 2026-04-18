/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { IconMenu2 } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';

type RestaurantBrand = {
  name: string | null;
  logoUrl: string | null;
};

export function Header() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryRestaurantSlug =
    searchParams.get('restaurantSlug') ?? searchParams.get('slug') ?? undefined;
  const pathSlug = pathname?.match(/^\/web-app\/([^/]+)/)?.[1] ?? undefined;
  const slugForApi = queryRestaurantSlug ?? pathSlug;

  const [brand, setBrand] = useState<RestaurantBrand>({
    name: 'Restaurant',
    logoUrl: null,
  });
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const inferredSubdomain = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const hostname = window.location.hostname || '';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (rootDomain) {
      const suffix = `.${rootDomain}`;
      if (hostname.endsWith(suffix)) {
        const sub = hostname.slice(0, -suffix.length);
        return sub || null;
      }
    }

    const parts = hostname.split('.');
    return parts.length >= 3 ? parts[0] : null;
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        let url: string | null = null;
        if (slugForApi) {
          url = `/api/customer/restaurant?slug=${encodeURIComponent(slugForApi)}`;
        } else {
          const subdomain = inferredSubdomain;
          if (!subdomain) return;
          url = `/api/customer/restaurant?subdomain=${encodeURIComponent(subdomain)}`;
        }

        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const r = data?.data;
        if (!r) return;
        setBrand({
          name: r?.name ?? 'Restaurant',
          logoUrl: r?.logoUrl ?? null,
        });
        setLogoLoadFailed(false);
      } catch {
        // Keep current default values if the request fails.
      }
    };

    void run();
  }, [inferredSubdomain, slugForApi]);

  return (
    <header className="border-b border-[#c2410c] bg-[#ea580c] px-6 py-4 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#fff7ed]/25 ring-1 ring-[#fed7aa]/50">
            {brand.logoUrl && !logoLoadFailed ? (
              <img
                src={brand.logoUrl}
                alt={brand.name ?? 'Restaurant'}
                className="h-full w-full object-cover"
                onError={() => setLogoLoadFailed(true)}
              />
            ) : (
              <span className="text-xl font-bold text-white">
                {(brand.name ?? 'Restaurant').charAt(0)}
              </span>
            )}
          </span>
          <span className="text-lg font-semibold tracking-wide text-white">
            {brand.name ?? 'Restaurant'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/85">Welcome</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full border border-[#fed7aa] bg-[#fff7ed] text-[#9a3412] hover:bg-white"
          >
            <IconMenu2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
