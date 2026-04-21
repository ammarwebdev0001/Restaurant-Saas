'use client';

import Link from 'next/link';
import { ProductsTab } from '@/components/dashboard/menu-manager/products-tab';
import { MenuPageShell } from '@/components/dashboard/menu-manager/menu-page-shell';
import { useRestaurantMenu } from '@/components/dashboard/menu-manager/use-restaurant-menu';
import ErrorBoundary from '@/components/toaster/toaster';
import { Button } from '@/components/ui/button';

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
          <div className="mb-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/product/swatches">Open Swatches Module</Link>
            </Button>
          </div>
          <ProductsTab categories={categories} onRefresh={load} />
        </MenuPageShell>
      </ErrorBoundary>
    </div>
  );
}
