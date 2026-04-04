import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { Header } from '@/components/customer-app/header';
import { Footer } from '@/components/customer-app/footer';

export const metadata = {
  title: 'Enjoy Tacos',
  description: 'Order your favorite tacos and offers',
};

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-zinc-950 text-white antialiased">
      <div className="flex min-h-screen flex-col">
        <Suspense
          fallback={
            <header className="h-[72px] border-b bg-primary px-6 py-4 backdrop-blur" />
          }
        >
          <Header />
        </Suspense>

        <main className="flex-1">{children}</main>

        <Footer />
      </div>
    </div>
  );
}
