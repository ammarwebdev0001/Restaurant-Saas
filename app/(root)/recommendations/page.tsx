'use client';

import { RecommendationsTab } from '@/components/dashboard/menu-manager/recommendations-tab';
import { MenuPageShell } from '@/components/dashboard/menu-manager/menu-page-shell';
import { useRestaurantMenu } from '@/components/dashboard/menu-manager/use-restaurant-menu';
import ErrorBoundary from '@/components/toaster/toaster';

export default function RecommendationsPage() {
  const { loading, categories, load } = useRestaurantMenu();

  return (
    <div className="w-full">
      <ErrorBoundary>
        <MenuPageShell
          title="Recommendations"
          description="Link add-on options to products (e.g. choose a sauce or drink from another category)."
          loading={loading}
        >
          <RecommendationsTab categories={categories} onRefresh={load} />
        </MenuPageShell>
      </ErrorBoundary>
    </div>
  );
}
