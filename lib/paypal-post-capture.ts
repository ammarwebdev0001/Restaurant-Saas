import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

import { db } from '@/lib/db';
import {
  capturePayPalOrder,
  getPayPalOrder,
  parsePayPalCustomId,
  type PayPalOrderMetadata,
} from '@/lib/paypal-server';

export type PayPalPostCaptureResult = {
  paid: boolean;
  status: 'completed' | 'pending';
  metadata: PayPalOrderMetadata;
  orderSync: 'skipped' | 'completed' | 'already_completed';
  orderId?: string;
  shortOrderId?: string;
  ticketNumber?: number | null;
  restaurantId?: string;
  planSynced: boolean;
};

/**
 * Captures a PayPal order (or reads it if already captured) and applies the
 * resulting metadata (`source`, `intentId`, `plan`, `restaurantId`) to:
 *   - existing direct orders (mark payment completed),
 *   - stored "intent" payloads (POST to /api/customer/orders or /api/kiosk/orders),
 *   - restaurant subscriptions (activate + record payment).
 *
 * Returns a stable summary used by both the legacy redirect verify endpoint
 * and the new inline button capture endpoint.
 */
export async function applyPayPalPostCapture(opts: {
  orderToken: string;
  baseUrl: string;
}): Promise<PayPalPostCaptureResult> {
  const { orderToken, baseUrl } = opts;

  let captured = false;
  let captureAmount = 0;
  let captureCurrency = 'EUR';
  let customIdRaw = '';

  try {
    const capture = await capturePayPalOrder(orderToken);
    const pu = capture.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    customIdRaw = pu?.custom_id ?? '';
    captured = String(cap?.status ?? '').toUpperCase() === 'COMPLETED';
    captureAmount = Number(cap?.amount?.value ?? 0) || 0;
    captureCurrency = String(cap?.amount?.currency_code ?? 'EUR').toUpperCase();
  } catch {
    const order = await getPayPalOrder(orderToken);
    const pu = order.purchase_units?.[0];
    customIdRaw = pu?.custom_id ?? '';
    captured = String(order.status ?? '').toUpperCase() === 'COMPLETED';
  }

  let meta: PayPalOrderMetadata = parsePayPalCustomId(customIdRaw);
  let orderSync: PayPalPostCaptureResult['orderSync'] = 'skipped';
  let orderId: string | undefined;
  let shortOrderId: string | undefined;
  let ticketNumber: number | null | undefined;
  let restaurantIdResult: string | undefined;
  let planSynced = false;

  // Newer flows (subscription / online / kiosk inline buttons) put only a
  // short `intentId` in PayPal `custom_id` to avoid the 127-char limit and
  // store the full metadata + payload server-side. Merge those fields in.
  let intent: {
    endpoint?: '/api/customer/orders' | '/api/kiosk/orders' | null;
    payload?: unknown;
    metadata?: Record<string, string>;
    status?: string;
  } | null = null;
  let intentKey: string | null = null;
  if (typeof meta.intentId === 'string' && meta.intentId.trim()) {
    intentKey = `paypal_order_intent:${meta.intentId.trim()}`;
    const row = await db.platformSetting.findUnique({
      where: { key: intentKey },
      select: { value: true },
    });
    if (row) {
      try {
        intent = JSON.parse(row.value);
        if (intent?.metadata && typeof intent.metadata === 'object') {
          meta = { ...intent.metadata, ...meta } as PayPalOrderMetadata;
        }
      } catch {
        intent = null;
      }
    }
  }

  if (captured) {
    if (typeof meta.orderId === 'string' && meta.orderId.trim()) {
      orderId = meta.orderId.trim();
      const order = await db.order.findUnique({
        where: { id: orderId },
        select: { id: true, total: true, restaurantId: true },
      });
      if (order) {
        const lastPayment = await db.payment.findFirst({
          where: { orderId: order.id },
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true },
        });
        if (lastPayment?.status === 'completed') {
          orderSync = 'already_completed';
        } else if (lastPayment) {
          await db.payment.update({
            where: { id: lastPayment.id },
            data: {
              status: 'completed',
              method: 'PayPal',
              amount: captureAmount > 0 ? captureAmount : order.total,
            },
          });
          orderSync = 'completed';
        } else {
          await db.payment.create({
            data: {
              orderId: order.id,
              amount: captureAmount > 0 ? captureAmount : order.total,
              status: 'completed',
              method: 'PayPal',
              restaurantId: order.restaurantId,
            },
          });
          orderSync = 'completed';
        }
      }
    } else if (intent?.endpoint && intent.payload && intentKey) {
      if (intent.status !== 'completed') {
        try {
          const res = await fetch(`${baseUrl}${intent.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(intent.payload),
          });
          if (res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              data?: {
                orderId?: string;
                shortOrderId?: string;
                restaurantId?: string;
                ticketNumber?: number | null;
              };
            };
            orderId =
              typeof body?.data?.orderId === 'string'
                ? body.data.orderId
                : undefined;
            shortOrderId =
              typeof body?.data?.shortOrderId === 'string'
                ? body.data.shortOrderId
                : undefined;
            restaurantIdResult =
              typeof body?.data?.restaurantId === 'string'
                ? body.data.restaurantId
                : undefined;
            ticketNumber =
              typeof body?.data?.ticketNumber === 'number'
                ? body.data.ticketNumber
                : null;
            await db.platformSetting.update({
              where: { key: intentKey },
              data: {
                value: JSON.stringify({
                  ...intent,
                  status: 'completed',
                  paypalOrderId: orderToken,
                  orderId,
                  shortOrderId,
                  ticketNumber,
                  completedAt: new Date().toISOString(),
                }),
              },
            });
            orderSync = 'completed';
          }
        } catch (e) {
          console.error('PayPal order intent sync failed:', e);
        }
      }
    }

    const rawPlan =
      typeof meta.plan === 'string' ? meta.plan.toUpperCase().trim() : '';
    const validPlans = Object.values(SubscriptionPlan) as string[];
    if (validPlans.includes(rawPlan)) {
      const plan = rawPlan as SubscriptionPlan;
      const restaurantId =
        typeof meta.restaurantId === 'string' ? meta.restaurantId.trim() : '';
      if (restaurantId) {
        const periodStart = new Date();
        const periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 30);
        const idempotencyKey = `paypal_order:${orderToken}`;
        const existing = await db.subscriptionPayment.findFirst({
          where: { restaurantId, notes: idempotencyKey },
          select: { id: true },
        });
        if (!existing) {
          await db.$transaction(async (tx) => {
            const sub = await tx.restaurantSubscription.upsert({
              where: { restaurantId },
              create: {
                restaurantId,
                plan,
                status: SubscriptionStatus.ACTIVE,
                trialEndsAt: null,
                currentPeriodEnd: periodEnd,
              },
              update: {
                plan,
                status: SubscriptionStatus.ACTIVE,
                trialEndsAt: null,
                currentPeriodEnd: periodEnd,
              },
              select: { id: true },
            });
            await tx.subscriptionPayment.create({
              data: {
                restaurantId,
                restaurantSubscriptionId: sub.id,
                amount: captureAmount,
                currency: captureCurrency,
                paidAt: periodStart,
                periodStart,
                periodEnd,
                notes: idempotencyKey,
              },
            });
          });
        }
        planSynced = true;
      }
    }
  }

  return {
    paid: captured,
    status: captured ? 'completed' : 'pending',
    metadata: meta,
    orderSync,
    orderId,
    shortOrderId,
    ticketNumber,
    restaurantId: restaurantIdResult,
    planSynced,
  };
}
