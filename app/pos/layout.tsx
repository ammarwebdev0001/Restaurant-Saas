import { PosLayoutShell } from '@/components/pos/pos-layout-shell';

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PosLayoutShell>{children}</PosLayoutShell>;
}
