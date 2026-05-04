'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { flushOrderOutbox } from '@/lib/offline/flush-outbox';
import { countOrderOutbox } from '@/lib/offline/outbox';

export function OfflineBootstrap() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' && navigator.onLine);
  }, []);

  const refreshPending = useCallback(async () => {
    try {
      setPending(await countOrderOutbox());
    } catch {
      setPending(0);
    }
  }, []);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    const onBox = () => void refreshPending();
    window.addEventListener('offline-outbox-changed', onBox);
    return () => window.removeEventListener('offline-outbox-changed', onBox);
  }, [refreshPending]);

  useEffect(() => {
    const runFlush = async () => {
      const n = await flushOrderOutbox();
      await refreshPending();
      if (n > 0) {
        toast.success(
          n === 1 ? 'Sent 1 pending order.' : `Sent ${n} pending orders.`
        );
      }
    };

    const onOnline = () => {
      setOnline(true);
      void runFlush();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      void runFlush();
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [refreshPending]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  if (online && pending === 0) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-3 left-1/2 z-[10000] max-w-[min(100vw-1.5rem,28rem)] -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-2 text-center text-sm text-foreground shadow-lg"
    >
      {!online && (
        <span className="font-medium text-amber-600 dark:text-amber-400">
          You are offline.
        </span>
      )}
      {!online && pending > 0 && <span className="mx-1 text-muted-foreground">·</span>}
      {pending > 0 && (
        <span className="text-muted-foreground">
          {pending} order{pending === 1 ? '' : 's'} will send when you are back online.
        </span>
      )}
    </div>
  );
}
