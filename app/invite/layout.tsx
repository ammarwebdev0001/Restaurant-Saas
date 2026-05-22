import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restaurant invitation',
  description: 'Accept an invitation to join a restaurant team',
  icons: {
    icon: '/Logo.png',
    apple: '/Logo.png',
  },
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
