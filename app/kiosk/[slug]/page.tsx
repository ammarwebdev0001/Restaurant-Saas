import { Suspense } from 'react';

import { KioskApp } from '@/components/kiosk/kiosk-app';

import '../kiosk-light.css';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function KioskPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="kiosk-light-root min-h-screen bg-[#f8fafc]">
      <Suspense fallback={null}>
        <KioskApp slug={decodeURIComponent(slug)} />
      </Suspense>
    </div>
  );
}
