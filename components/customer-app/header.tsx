/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { IconMenu2 } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { buildThemeCssVars } from '@/lib/restaurant-theme';

type RestaurantBrand = {
  name: string | null;
  logoUrl: string | null;
  themePrimaryColor?: string | null;
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
    themePrimaryColor: null,
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
          themePrimaryColor: r?.themePrimaryColor ?? null,
        });
        setLogoLoadFailed(false);
      } catch {
        // Keep current default values if the request fails.
      }
    };

    void run();
  }, [inferredSubdomain, slugForApi]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const host = document.querySelector('.web-app-customer') as HTMLElement | null;
    if (!host) return;
    const vars = buildThemeCssVars(brand.themePrimaryColor);
    Object.entries(vars).forEach(([key, value]) => host.style.setProperty(key, value));
  }, [brand.themePrimaryColor]);

  return (
    <header className="border-b border-primary bg-primary px-6 py-4 text-primary-foreground backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white/20 ring-1 ring-white/40">
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
          <span className="text-lg font-semibold tracking-wide text-primary-foreground">
            {brand.name ?? 'Restaurant'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-primary-foreground/85">Welcome</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full border border-primary/20 bg-white text-primary hover:bg-white/95"
          >
            <IconMenu2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
