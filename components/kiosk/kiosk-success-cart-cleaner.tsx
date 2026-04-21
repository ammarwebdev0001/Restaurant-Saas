'use client';

import { useEffect } from 'react';

type Props = {
  slug: string;
  hasSessionId: boolean;
};

export function KioskSuccessCartCleaner({ slug, hasSessionId }: Props) {
  useEffect(() => {
    if (!hasSessionId) return;
    try {
      localStorage.removeItem(`kiosk-cart-${slug}`);
      localStorage.removeItem(`kiosk-checkout-draft-${slug}`);
    } catch {
      // ignore storage errors
    }
  }, [hasSessionId, slug]);

  return null;
}

