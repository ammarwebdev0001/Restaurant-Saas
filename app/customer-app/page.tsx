'use client';

import { useState } from 'react';
import { Header } from '@/components/customer-app/header';
import { HeroSection } from '@/components/customer-app/hero-section';
import { Sidebar } from '@/components/customer-app/sidebar';
import { Footer } from '@/components/customer-app/footer';

export default function CustomerLandingPage() {
  const [mode, setMode] = useState<'delivery' | 'takeaway'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [apartmentDoorNumber, setApartmentDoorNumber] = useState('');
  const [gateCode, setGateCode] = useState('');
  const [addressName, setAddressName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 md:grid-cols-[1.75fr,1fr]">
        <HeroSection />
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
        />
      </main>

    </div>
  );
}
