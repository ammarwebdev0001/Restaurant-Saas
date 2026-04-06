'use client';

import { useEffect, useState } from 'react';
import { HeroSection } from '@/components/customer-app/hero-section';
import { Sidebar } from '@/components/customer-app/sidebar';
import { StoreMenu } from '@/components/customer-app/store-menu';

export function WebAppStorefront({ slug }: { slug: string }) {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/customer/restaurant?slug=${encodeURIComponent(slug)}`
        );
        const json = await res.json().catch(() => ({}));
        const name = json?.data?.name as string | undefined;
        if (!cancelled && name) setRestaurantName(name);
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
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 md:grid-cols-[1.75fr,1fr]">
      <div className="space-y-8">
        <HeroSection
          restaurantName={restaurantName ?? slug}
          headline="Build your order"
          subheadline={`Store slug: ${slug}`}
        />
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
        selectedStoreId={selectedStoreId}
        setSelectedStoreId={setSelectedStoreId}
        restaurantSlug={slug}
      />
    </div>
  );
}
