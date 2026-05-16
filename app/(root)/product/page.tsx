'use client';

import { ProductsTab } from '@/components/dashboard/menu-manager/products-tab';
import { MenuPageShell } from '@/components/dashboard/menu-manager/menu-page-shell';
import { useRestaurantMenu } from '@/components/dashboard/menu-manager/use-restaurant-menu';
import ErrorBoundary from '@/components/toaster/toaster';

export default function ProductPage() {
  const { loading, categories, load } = useRestaurantMenu();

  return (
    <div className="w-full">
      <ErrorBoundary>
        <MenuPageShell
          title="Products"
          description="Add menu items with photos, pricing, optional sale price, and descriptions. Manage swatches in a dedicated module."
          loading={loading}
        >
         
          <ProductsTab categories={categories} onRefresh={load} />
        </MenuPageShell>
      </ErrorBoundary>
    </div>
  );
}
