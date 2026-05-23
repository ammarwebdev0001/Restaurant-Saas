'use client';

import {
  useRestaurantDocumentBranding,
  type UseRestaurantDocumentBrandingOptions,
} from '@/hooks/use-restaurant-document-branding';

/**
 * @deprecated Branding runs globally via `RestaurantBrandingProvider` in `app/providers.tsx`.
 * Kept as a no-op so older imports do not mount a second head/DOM updater.
 */
export function RestaurantDocumentBranding(
  _props: UseRestaurantDocumentBrandingOptions
) {
  return null;
}
