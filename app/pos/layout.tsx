import { PosLayoutHeader } from '@/components/pos/pos-layout-header';

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-background">
      <PosLayoutHeader />
      <div className="flex min-h-0 flex-1 flex-col p-3 md:p-4">{children}</div>
    </div>
  );
}
