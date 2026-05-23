'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Sparkles } from 'lucide-react';

import { Sidebar } from '@/components/customer-app/sidebar';
import { StorefrontLayeredBackground } from '@/components/customer-app/storefront-layered-background';
import { StorefrontHero } from '@/components/customer-app/storefront/storefront-hero';
import { StorefrontLocations } from '@/components/customer-app/storefront/storefront-locations';
import { StorefrontSteps } from '@/components/customer-app/storefront/storefront-steps';
import { buildStorefrontThemeVars } from '@/lib/restaurant-theme';

export function WebAppStorefront({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [mainBannerUrl, setMainBannerUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [themePrimaryColor, setThemePrimaryColor] = useState<string | null>(
    null
  );
  const [brandLoading, setBrandLoading] = useState(true);
  const [branchCount, setBranchCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBrandLoading(true);
      try {
        const res = await fetch(
          `/api/customer/restaurant?slug=${encodeURIComponent(slug)}`
        );
        const json = await res.json().catch(() => ({}));
        const data = json?.data as
          | {
              name?: string;
              mainBannerUrl?: string | null;
              logoUrl?: string | null;
              themePrimaryColor?: string | null;
            }
          | null
          | undefined;
        if (cancelled) return;
        if (data?.name) setRestaurantName(data.name);
        setMainBannerUrl(
          typeof data?.mainBannerUrl === 'string' && data.mainBannerUrl.trim()
            ? data.mainBannerUrl.trim()
            : null
        );
        setLogoUrl(
          typeof data?.logoUrl === 'string' && data.logoUrl.trim()
            ? data.logoUrl.trim()
            : null
        );
        setThemePrimaryColor(
          typeof data?.themePrimaryColor === 'string' &&
            data.themePrimaryColor.trim()
            ? data.themePrimaryColor.trim()
            : null
        );
      } catch {
        /* fall back to slug */
      } finally {
        if (!cancelled) setBrandLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/customer/branches?slug=${encodeURIComponent(slug)}`
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        const branches = Array.isArray(json?.data) ? json.data : [];
        setBranchCount(branches.length);
      } catch {
        if (!cancelled) setBranchCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const [mode, setMode] = useState<'delivery' | 'takeaway'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [apartmentDoorNumber, setApartmentDoorNumber] = useState('');
  const [gateCode, setGateCode] = useState('');
  const [addressName, setAddressName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const hasBanner = Boolean(mainBannerUrl?.trim());
  const displayName = restaurantName ?? slug;
  const themeVars = buildStorefrontThemeVars(
    themePrimaryColor
  ) as CSSProperties;

  return (
    <div
      className="relative isolate z-0 flex min-h-[100dvh] w-full flex-1 flex-col"
      style={themeVars}
    >
      <StorefrontLayeredBackground bannerUrl={mainBannerUrl} />

      <div className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {brandLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              aria-label="Loading"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[1fr,380px] xl:gap-10">
            <div className="space-y-8">
              {hasBanner ? (
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{t('storefrontOrderOnline')}</span>
                  </div>
                  <StorefrontHero
                    restaurantName={displayName}
                    logoUrl={logoUrl}
                    hasBanner={hasBanner}
                    branchCount={branchCount}
                  />
                </div>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--restaurant-glass-border,#e2e8f0)] bg-[var(--restaurant-glass,rgba(255,255,255,0.85))] px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{t('storefrontOrderOnline')}</span>
                  </div>
                  <StorefrontHero
                    restaurantName={displayName}
                    logoUrl={logoUrl}
                    hasBanner={hasBanner}
                    branchCount={branchCount}
                  />
                </>
              )}

              <div id="orderMethod">
                <StorefrontSteps />
              </div>

              <div id="locations">
                <StorefrontLocations slug={slug} />
              </div>
            </div>

            <div id="order" className="scroll-mt-10 xl:sticky xl:top-24">
              <Sidebar
                mode={mode}
                setMode={setMode}
                deliveryAddress={deliveryAddress}
                setDeliveryAddress={setDeliveryAddress}
                apartmentDoorNumber={apartmentDoorNumber}
                setApartmentDoorNumber={setApartmentDoorNumber}
                gateCode={gateCode}
                setGateCode={setGateCode}
                addressName={addressName}
                setAddressName={setAddressName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                selectedStoreId={selectedStoreId}
                setSelectedStoreId={setSelectedStoreId}
                restaurantSlug={slug}
                className="border-[var(--restaurant-glass-border,#e2e8f0)] bg-[var(--restaurant-glass,rgba(255,255,255,0.94))] shadow-[0_24px_60px_-20px_color-mix(in_srgb,var(--restaurant-primary,#0f172a)_25%,transparent)] backdrop-blur-xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
