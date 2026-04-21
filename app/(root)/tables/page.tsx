'use client';

import Link from 'next/link';
import ErrorBoundary from '@/components/toaster/toaster';
import { MenuPageShell } from '@/components/dashboard/menu-manager/menu-page-shell';
import { TablesModule } from '@/components/dashboard/tables/tables-module';
import { Button } from '@/components/ui/button';

export default function TablesPage() {
  return (
    <div className="w-full">
      <ErrorBoundary>
        <MenuPageShell
          title="Tables"
          description="Add, edit, or remove dining tables. They appear in the POS table selector for dine-in orders."
          loading={false}
        >
          <TablesModule />
        </MenuPageShell>
      </ErrorBoundary>
    </div>
  );
}
