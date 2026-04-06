/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconMenu2 } from '@tabler/icons-react';
import { ModeToggle } from '../darkmode/darkmode';
import { usePathname, useSearchParams } from 'next/navigation';

type RestaurantBrand = {
  name: string | null;
  logoUrl: string | null;
};

export function Header() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryStoreId = searchParams.get('storeId') ?? undefined;
  const queryStoreName = searchParams.get('storeName') ?? undefined;
  const querySlug = searchParams.get('slug') ?? undefined;
  const pathSlug =
    pathname?.match(/^\/web-app\/([^/]+)/)?.[1] ?? undefined;
  const slugForApi = querySlug ?? pathSlug;

  const [brand, setBrand] = useState<RestaurantBrand>({
    name: queryStoreName ?? 'Restaurant',
    logoUrl: null,
  });
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const inferredSubdomain = useMemo(() => {
    if (queryStoreId) return queryStoreId;
    if (typeof window === 'undefined') return null;

    const hostname = window.location.hostname || '';
    // Env-driven subdomain parsing, e.g. royalspoon.<root-domain>.
    // Set NEXT_PUBLIC_ROOT_DOMAIN=localhost for local, and domain.com for prod.
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (rootDomain) {
      const suffix = `.${rootDomain}`;
      if (hostname.endsWith(suffix)) {
        const sub = hostname.slice(0, -suffix.length);
        return sub || null;
      }
    }

    // Generic fallback for hosts with 3+ parts
    const parts = hostname.split('.');
    return parts.length >= 3 ? parts[0] : null;
  }, [queryStoreId]);

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
          name: r?.name ?? queryStoreName ?? 'Restaurant',
          logoUrl: r?.logoUrl ?? null,
        });
        setLogoLoadFailed(false);
      } catch {
        // Keep current default values if the request fails.
      }
    };

    void run();
  }, [inferredSubdomain, queryStoreName, slugForApi]);

  return (
    <header className="border-b bg-primary px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between ">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary/20 ring-1 ring-primary/20">
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
          <span className="text-sm text-primary-foreground/80 text-white">
            {/* Keep customer header lightweight; show name if we have it from query */}
            {queryStoreName ? 'Welcome' : 'Customer'}
          </span>
          <Button variant="outline" size="sm" className="rounded-full">
            <IconMenu2 className="h-4 w-4" />
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
