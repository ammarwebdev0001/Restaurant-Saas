/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { IconMenu2 } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buildThemeCssVars } from '@/lib/restaurant-theme';
import { setUiLanguage } from '@/lib/i18n/client';
import type { UiLanguage } from '@/lib/i18n/resources';

type RestaurantBrand = {
  name: string | null;
  logoUrl: string | null;
  themePrimaryColor?: string | null;
};

export function Header() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryRestaurantSlug =
    searchParams.get('restaurantSlug')?.trim() ||
    searchParams.get('slug')?.trim() ||
    undefined;
  const pathSlugRaw = pathname?.match(/^\/web-app\/([^/]+)/)?.[1] ?? undefined;
  const pathSlug =
    pathSlugRaw && pathSlugRaw !== 'order' && pathSlugRaw !== 'track-order'
      ? decodeURIComponent(pathSlugRaw)
      : undefined;
  const slugForApi = queryRestaurantSlug ?? pathSlug;

  const [brand, setBrand] = useState<RestaurantBrand>({
    name: 'Restaurant',
    logoUrl: null,
    themePrimaryColor: null,
  });
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const { t, i18n } = useTranslation();
  const uiLang: UiLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'es';
  const applyLanguage = (lang: UiLanguage) => {
    setUiLanguage(lang);
    void i18n.changeLanguage(lang);
  };

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
          logoUrl:
            typeof r?.logoUrl === 'string' && r.logoUrl.trim().length > 0
              ? r.logoUrl.trim()
              : null,
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

  const normalizedLogoUrl =
    typeof brand.logoUrl === 'string' && brand.logoUrl.trim().length > 0
      ? brand.logoUrl.trim()
      : null;

  return (
    <header className="border-b border-primary bg-primary px-6 py-4 text-primary-foreground backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white/20 ring-1 ring-white/40">
            {normalizedLogoUrl && !logoLoadFailed ? (
              <img
                key={normalizedLogoUrl}
                src={normalizedLogoUrl}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                className="border border-primary/20 bg-white text-primary hover:bg-white/95"
              >
                {t('language')}: {uiLang.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  applyLanguage('es');
                }}
                onClick={() => {
                  applyLanguage('es');
                }}
              >
                Espanol
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  applyLanguage('en');
                }}
                onClick={() => {
                  applyLanguage('en');
                }}
              >
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-sm text-primary-foreground/85">
            {uiLang === 'en' ? 'Welcome' : 'Bienvenido'}
          </span>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full border border-primary/20 bg-white text-primary hover:bg-white/95"
          >
            <IconMenu2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
