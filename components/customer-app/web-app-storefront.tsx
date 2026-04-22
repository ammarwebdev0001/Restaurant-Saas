'use client';

import { useEffect, useState } from 'react';

import { HeroSection } from '@/components/customer-app/hero-section';
import { Sidebar } from '@/components/customer-app/sidebar';
import { StoreMenu } from '@/components/customer-app/store-menu';

export function WebAppStorefront({ slug }: { slug: string }) {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [mainBannerUrl, setMainBannerUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
            }
          | null
          | undefined;
        if (cancelled) return;
        const name = data?.name;
        const banner = data?.mainBannerUrl;
        const logo = data?.logoUrl;
        if (name) setRestaurantName(name);
        setMainBannerUrl(
          typeof banner === 'string' && banner.trim() ? banner.trim() : null
        );
        setLogoUrl(
          typeof logo === 'string' && logo.trim() ? logo.trim() : null
        );
      } catch {
        /* hero falls back to slug */
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

  const bannerSrc = mainBannerUrl?.trim() ?? '';
  const hasBanner = Boolean(bannerSrc);

  return (
    <div className="relative isolate flex min-h-[100dvh] w-full flex-1 flex-col">
      {hasBanner ? (
        <>
          {/* `<img>` is more reliable than CSS `background-image` for arbitrary CDN URLs + flex height. */}
          <img
            src={bannerSrc}
            alt=""
            aria-hidden
            decoding="async"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 z-0 block min-h-[100dvh] w-full object-cover object-center"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] min-h-[100dvh] bg-black/25 "
          />
        </>
      ) : null}

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 md:grid-cols-[1.75fr,1fr]">
        <div className="space-y-8">
          {/* <HeroSection
            restaurantName={restaurantName ?? slug}
            subheadline={`Store slug: ${slug}`}
            bannerUrl={mainBannerUrl ?? undefined}
            logoUrl={logoUrl ?? undefined}
            hideLargeBanner={hasBanner}
          />
          <StoreMenu slug={slug} /> */}
        </div>
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
        />
      </div>
    </div>
  );
}
