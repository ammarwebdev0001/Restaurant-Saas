'use client';

import { CategoriesTab } from '@/components/dashboard/menu-manager/categories-tab';
import { MenuPageShell } from '@/components/dashboard/menu-manager/menu-page-shell';
import { useRestaurantMenu } from '@/components/dashboard/menu-manager/use-restaurant-menu';
import ErrorBoundary from '@/components/toaster/toaster';

export default function CategoriesPage() {
  const { loading, categories, load } = useRestaurantMenu();

  return (
    <div className="w-full">
      <ErrorBoundary>
        <MenuPageShell
          title="Categories"
          description="Create and organize menu sections (e.g. Mains, Drinks, Sauces). Add categories before products."
          loading={loading}
        >
          <CategoriesTab categories={categories} onRefresh={load} />
        </MenuPageShell>
      </ErrorBoundary>
    </div>
  );
}
