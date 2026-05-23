'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import eventBus from '@/lib/even';
import {
  applyRestaurantDocumentBranding,
  pageTitleSuffixForPath,
} from '@/lib/restaurant-document-branding';

type RestaurantPayload = {
  name?: string | null;
  slug?: string | null;
  logoUrl?: string | null;
};

export type UseRestaurantDocumentBrandingOptions = {
  /** Fixed suffix, e.g. "POS". Overrides path-based suffix when set. */
  titleSuffix?: string | null;
  /** When true (default), derive suffix from the current path (Sales, KDS, …). */
  deriveSuffixFromPath?: boolean;
  enabled?: boolean;
};

export function useRestaurantDocumentBranding(
  options: UseRestaurantDocumentBrandingOptions = {}
) {
  const pathname = usePathname();
  const {
    titleSuffix: titleSuffixProp,
    deriveSuffixFromPath = true,
    enabled = true,
  } = options;

  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const pageSuffix = useMemo(() => {
    if (titleSuffixProp !== undefined) return titleSuffixProp;
    if (!deriveSuffixFromPath) return null;
    return pageTitleSuffixForPath(pathname ?? '');
  }, [titleSuffixProp, deriveSuffixFromPath, pathname]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/restaurant', { cache: 'no-store' });
        const json = (await res.json().catch(() => ({}))) as {
          data?: RestaurantPayload | null;
        };
        if (cancelled) return;
        const d = json?.data;
        setRestaurantName(d?.name?.trim() || 'Restaurant');
        const slug = d?.slug?.trim();
        setRestaurantSlug(slug && slug.length > 0 ? slug : null);
        const logo = d?.logoUrl?.trim();
        setLogoUrl(logo && logo.length > 0 ? logo : null);
        setLogoFailed(false);
      } catch {
        if (!cancelled) {
          setRestaurantName('Restaurant');
          setRestaurantSlug(null);
          setLogoUrl(null);
        }
      }
    };

    void load();
    const onRefresh = () => void load();
    eventBus.on('fetchStoreData', onRefresh);

    return () => {
      cancelled = true;
      eventBus.removeListener('fetchStoreData', onRefresh);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const id = requestAnimationFrame(() => {
      applyRestaurantDocumentBranding({
        restaurantName,
        logoUrl,
        pageSuffix,
        logoFailed,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [enabled, restaurantName, logoUrl, pageSuffix, logoFailed]);

  return {
    restaurantName,
    restaurantSlug,
    logoUrl,
    logoFailed,
    pageSuffix,
    setLogoFailed,
  };
}
