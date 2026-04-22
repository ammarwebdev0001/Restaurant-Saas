import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { Header } from '@/components/customer-app/header';
import { Footer } from '@/components/customer-app/footer';

import './web-app-customer.css';

export const metadata: Metadata = {
  title: {
    default: 'Order online',
    template: '%s',
  },
  description: 'Browse the menu and order from your restaurant.',
};

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="web-app-customer min-h-screen bg-gradient-to-b from-[#f5f3ff] via-[#ffffff] to-[#e8eef5] text-[#0f172a] antialiased">
      <div className="flex min-h-screen flex-col">
        <Suspense
          fallback={
            <header className="h-[72px] border-b border-primary bg-primary px-6 py-4" />
          }
        >
          <Header />
        </Suspense>

        <main className="relative flex min-h-0 flex-1 flex-col">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
