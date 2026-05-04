import { listOrderOutbox, removeOrderOutboxKey } from '@/lib/offline/outbox';

function isRetriableStatus(status: number): boolean {
  if (status === 429 || status === 408) return true;
  return status >= 500;
}

/**
 * POST each queued order with the same idempotency key the client used when enqueueing.
 * @returns how many queued entries were successfully accepted by the server.
 */
export async function flushOrderOutbox(): Promise<number> {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;

  let synced = 0;
  const pending = await listOrderOutbox();
  for (const item of pending) {
    try {
      const res = await fetch(item.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': item.idempotencyKey,
        },
        body: item.body,
      });

      if (res.ok || res.status === 201) {
        await removeOrderOutboxKey(item.idempotencyKey);
        synced += 1;
        continue;
      }

      if (!isRetriableStatus(res.status)) {
        await removeOrderOutboxKey(item.idempotencyKey);
      }
    } catch {
      break;
    }
  }
  if (synced > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-outbox-changed'));
  }
  return synced;
}
