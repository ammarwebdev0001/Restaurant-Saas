import type { Metadata } from 'next';

import { KioskApp } from '@/components/kiosk/kiosk-app';

import '../kiosk-light.css';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Kiosk · ${slug}`,
    description: 'Self-service ordering kiosk',
  };
}

export default async function KioskPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="kiosk-light-root min-h-screen bg-[#f8fafc]">
      <KioskApp slug={decodeURIComponent(slug)} />
    </div>
  );
}
