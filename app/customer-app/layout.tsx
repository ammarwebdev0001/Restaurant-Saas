import type { ReactNode } from 'react';

export const metadata = {
  title: 'Enjoy Tacos',
  description: 'Order your favorite tacos and offers',
};

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
