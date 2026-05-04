import { enqueueOrderOutbox, type OutboxKind } from '@/lib/offline/outbox';

export type PlacedOrderPayload = {
  orderId: string;
  shortOrderId: string;
  restaurantId: string;
  ticketNumber: number | null;
};

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function isLikelyNetworkFailure(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const err = e as { name?: string; message?: string; cause?: unknown };
  if (err.name === 'TypeError') {
    const msg = String(err.message ?? '');
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
      return true;
    }
  }
  return false;
}

async function postOrderJson(
  url: string,
  body: unknown,
  idempotencyKey: string
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json };
}

function parsePlaced(json: unknown): PlacedOrderPayload | null {
  if (!json || typeof json !== 'object') return null;
  const data = (json as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const orderId = typeof d.orderId === 'string' ? d.orderId : null;
  const shortOrderId =
    typeof d.shortOrderId === 'string' ? d.shortOrderId : orderId;
  const restaurantId = typeof d.restaurantId === 'string' ? d.restaurantId : '';
  const tn = d.ticketNumber;
  const ticketNumber = typeof tn === 'number' ? tn : null;
  if (!orderId || !shortOrderId) return null;
  return {
    orderId,
    shortOrderId,
    restaurantId,
    ticketNumber,
  };
}

export type SubmitOrderSent = { status: 'sent'; data: PlacedOrderPayload };
export type SubmitOrderQueued = { status: 'queued'; idempotencyKey: string };
export type SubmitOrderResult = SubmitOrderSent | SubmitOrderQueued;

export async function submitCustomerOrder(body: unknown): Promise<SubmitOrderResult> {
  return submitOrderWithOutbox('/api/customer/orders', body, 'customer_order');
}

export async function submitKioskOrder(body: unknown): Promise<SubmitOrderResult> {
  return submitOrderWithOutbox('/api/kiosk/orders', body, 'kiosk_order');
}

async function submitOrderWithOutbox(
  url: string,
  body: unknown,
  kind: OutboxKind
): Promise<SubmitOrderResult> {
  const idempotencyKey = newIdempotencyKey();
  const serialized = JSON.stringify(body);

  if (isOffline()) {
    await enqueueOrderOutbox({
      idempotencyKey,
      url,
      body: serialized,
      kind,
      createdAt: Date.now(),
    });
    return { status: 'queued', idempotencyKey };
  }

  try {
    const { ok, status, json } = await postOrderJson(url, body, idempotencyKey);
    if (ok || status === 201) {
      const data = parsePlaced(json);
      if (data) return { status: 'sent', data };
      throw new Error('Invalid order response');
    }
    const err = new Error(`Order request failed: ${status}`) as Error & {
      status?: number;
      body?: unknown;
    };
    err.status = status;
    err.body = json;
    throw err;
  } catch (e) {
    if (isOffline() || isLikelyNetworkFailure(e)) {
      await enqueueOrderOutbox({
        idempotencyKey,
        url,
        body: serialized,
        kind,
        createdAt: Date.now(),
      });
      return { status: 'queued', idempotencyKey };
    }
    throw e;
  }
}
