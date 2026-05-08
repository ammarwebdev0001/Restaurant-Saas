import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

import { db } from '@/lib/db';
import {
  capturePayPalOrder,
  getPayPalConfigError,
  getPayPalOrder,
  isPayPalConfigured,
  parsePayPalCustomId,
} from '@/lib/paypal-server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!isPayPalConfigured()) {
    return NextResponse.json(
      { error: getPayPalConfigError() ?? 'PayPal is not configured' },
      { status: 503 }
    );
  }

  const orderToken =
    req.nextUrl.searchParams.get('token')?.trim() ||
    req.nextUrl.searchParams.get('session_id')?.trim();
  if (!orderToken) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  try {
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

    const meta = parsePayPalCustomId(customIdRaw);
    let orderSync: 'skipped' | 'completed' | 'already_completed' = 'skipped';
    let orderId: string | undefined;
    let planSynced = false;

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
      } else if (typeof meta.intentId === 'string' && meta.intentId.trim()) {
        const key = `paypal_order_intent:${meta.intentId.trim()}`;
        const row = await db.platformSetting.findUnique({
          where: { key },
          select: { value: true },
        });
        if (row) {
          try {
            const parsed = JSON.parse(row.value) as {
              endpoint?: '/api/customer/orders' | '/api/kiosk/orders';
              payload?: unknown;
              status?: string;
            };
            if (
              parsed.endpoint &&
              parsed.payload &&
              parsed.status !== 'completed'
            ) {
              const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
              const res = await fetch(`${baseUrl}${parsed.endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed.payload),
              });
              if (res.ok) {
                const body = (await res.json().catch(() => ({}))) as {
                  data?: { orderId?: string };
                };
                orderId =
                  typeof body?.data?.orderId === 'string'
                    ? body.data.orderId
                    : undefined;
                await db.platformSetting.update({
                  where: { key },
                  data: {
                    value: JSON.stringify({
                      ...parsed,
                      status: 'completed',
                      paypalOrderId: orderToken,
                      orderId,
                      completedAt: new Date().toISOString(),
                    }),
                  },
                });
                orderSync = 'completed';
              }
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

    return NextResponse.json(
      {
        paid: captured,
        status: captured ? 'completed' : 'pending',
        metadata: meta,
        orderSync,
        orderId,
        planSynced,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('Verify PayPal token failed:', e);
    return NextResponse.json({ error: 'Could not verify payment session' }, { status: 502 });
  }
}

