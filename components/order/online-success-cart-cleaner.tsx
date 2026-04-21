'use client';

import { useEffect } from 'react';

type Props = {
  orderId: string;
  hasSessionId: boolean;
};

export function OnlineSuccessCartCleaner({ orderId, hasSessionId }: Props) {
  useEffect(() => {
    if (!hasSessionId) return;
    try {
      localStorage.removeItem(`cart-${orderId}`);
    } catch {
      // ignore storage errors
    }
  }, [hasSessionId, orderId]);

  return null;
}

