'use client';

import ErrorBoundary from '@/components/toaster/toaster';
import { MenuPageShell } from '@/components/dashboard/menu-manager/menu-page-shell';
import { SwatchesModule } from '@/components/dashboard/menu-manager/swatches-module';
import { useRestaurantMenu } from '@/components/dashboard/menu-manager/use-restaurant-menu';

export default function ProductSwatchesPage() {
  const { loading, categories, load } = useRestaurantMenu();

  return (
    <div className="w-full">
      <ErrorBoundary>
        <MenuPageShell
          title="Product Swatches"
          description="Manage swatches in a dedicated module: select product, then add swatch name, price, and image."
          loading={loading}
        >
          <SwatchesModule categories={categories} onRefresh={load} />
        </MenuPageShell>
      </ErrorBoundary>
    </div>
  );
}

