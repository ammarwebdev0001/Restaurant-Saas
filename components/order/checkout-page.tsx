'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { OrderInfo } from '@/components/order/order-types';
import { orderPathWithQuery } from '@/lib/order-search-params';
import { submitCustomerOrder } from '@/lib/offline/submit-order';

function formatOrderApiError(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return 'Could not place order. Please try again.';
  }
  const err = (body as { error?: unknown }).error;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'formErrors' in err) {
    return 'Invalid order data';
  }
  return 'Could not place order. Please try again.';
}

const SERVICE_FEE = 0.99;

type CheckoutPageProps = {
  orderType: 'delivery' | 'pickUp';
  orderId: string;
  orderInfo?: OrderInfo;
};

type CartModifierSelection = {
  attributeGroupId: string;
  groupName: string;
  selections: { menuItemId: string; name: string; unitPrice: number }[];
};

type CartLine = {
  lineId: string;
  menuItemId: string;
  productName: string;
  description: string | null;
  imageUrl: string | null;
  baseUnitPrice: number;
  quantity: number;
  modifiers: CartModifierSelection[];
  modifiersSignature: string;
};

function lineUnitTotal(line: CartLine) {
  const modTotal = line.modifiers.reduce(
    (sum, m) => sum + m.selections.reduce((s2, sel) => s2 + sel.unitPrice, 0),
    0
  );
  return line.baseUnitPrice + modTotal;
}

function lineTotal(line: CartLine) {
  return lineUnitTotal(line) * line.quantity;
}

function parseCartFromStorage(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const out: CartLine[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue;

      const maybeLine = row as Partial<CartLine> & {
        lineId?: string;
        baseUnitPrice?: number;
      };
      if (
        typeof maybeLine.lineId === 'string' &&
        typeof maybeLine.baseUnitPrice === 'number'
      ) {
        out.push({
          lineId: maybeLine.lineId,
          menuItemId: String(maybeLine.menuItemId ?? ''),
          productName: String((maybeLine as any).productName ?? ''),
          description: (maybeLine as any).description ?? null,
          imageUrl: (maybeLine as any).imageUrl ?? null,
          baseUnitPrice: maybeLine.baseUnitPrice,
          quantity: Number(maybeLine.quantity ?? 1),
          modifiers: Array.isArray((maybeLine as any).modifiers)
            ? (maybeLine as any).modifiers
            : [],
          modifiersSignature: String(maybeLine.modifiersSignature ?? ''),
        });
        continue;
      }

      // Legacy: { product: {id,name,price,image,description...}, quantity }
      const legacy = row as any;
      if (
        legacy?.product?.id &&
        typeof legacy.quantity === 'number' &&
        typeof legacy.product.price === 'number'
      ) {
        const p = legacy.product;
        out.push({
          lineId: `legacy-${p.id}`,
          menuItemId: p.id,
          productName: String(p.name ?? p.id),
          description: p.description ?? null,
          imageUrl: p.imageUrl ?? p.image ?? null,
          baseUnitPrice: Number(p.price),
          quantity: legacy.quantity,
          modifiers: [],
          modifiersSignature: '',
        });
      }
    }

    return out;
  } catch {
    return [];
  }
}

export default function CheckoutPageClient({
  orderType,
  orderId,
  orderInfo,
}: CheckoutPageProps) {
  const { t } = useTranslation();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const router = useRouter();
  const [cutlery, setCutlery] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCart(parseCartFromStorage(localStorage.getItem(`cart-${orderId}`)));
    setCartHydrated(true);
  }, [orderId]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + lineTotal(item), 0),
    [cart]
  );
  const grandTotal = total + SERVICE_FEE;

  const placeOrder = async () => {
    const slug = orderInfo?.restaurantSlug?.trim();
    if (!slug) {
      toast.error(
        'Missing store link. Open the menu from your restaurant page, then checkout again.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitCustomerOrder({
        restaurantSlug: slug,
        orderType,
        orderInfo: {
          mode: orderType,
          restaurantName: orderInfo?.restaurantName,
          storeId: orderInfo?.storeId,
          storeName: orderInfo?.storeName,
          storeAddress: orderInfo?.storeAddress,
          address: orderInfo?.address,
          apartment: orderInfo?.apartment,
          gateCode: orderInfo?.gateCode,
          addressName: orderInfo?.addressName,
          customerPhone: orderInfo?.customerPhone,
          restaurantSlug: slug,
        },
        lines: cart.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          unitPrice: lineUnitTotal(line),
          productName: line.productName,
          modifiers: line.modifiers,
        })),
        subtotal: total,
        total: grandTotal,
        cutlery,
        comment: comment.trim() || undefined,
      });

      if (result.status === 'queued') {
        toast.info(
          'You appear to be offline. This order is saved on this device and will be sent automatically when you are back online.'
        );
        return;
      }

      const placedId =
        result.data.shortOrderId ?? result.data.orderId;
      toast.success(
        placedId
          ? `Order placed. Reference: ${placedId}`
          : 'Order placed successfully.'
      );
      localStorage.removeItem(`cart-${orderId}`);
      router.push(
        orderPathWithQuery(
          `/order/${orderType}/${encodeURIComponent(orderId)}`,
          orderInfo
        )
      );
    } catch (e: unknown) {
      const ex = e as { body?: unknown };
      toast.error(
        ex.body !== undefined
          ? formatOrderApiError(ex.body)
          : 'Could not place order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startStripePayment = async () => {
    const slug = orderInfo?.restaurantSlug?.trim();
    if (!slug) {
      toast.error(
        'Missing store link. Open the menu from your restaurant page, then checkout again.'
      );
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty.');
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast.error('Card payment requires an internet connection.');
      return;
    }
    setSubmitting(true);
    try {
      const orderPayload = {
        restaurantSlug: slug,
        orderType,
        orderInfo: {
          mode: orderType,
          restaurantName: orderInfo?.restaurantName,
          storeId: orderInfo?.storeId,
          storeName: orderInfo?.storeName,
          storeAddress: orderInfo?.storeAddress,
          address: orderInfo?.address,
          apartment: orderInfo?.apartment,
          gateCode: orderInfo?.gateCode,
          addressName: orderInfo?.addressName,
          customerPhone: orderInfo?.customerPhone,
          restaurantSlug: slug,
        },
        lines: cart.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          unitPrice: lineUnitTotal(line),
          productName: line.productName,
          modifiers: line.modifiers,
        })),
        subtotal: total,
        total: grandTotal,
        cutlery,
        comment: comment.trim() || undefined,
        paymentStatus: 'pending' as const,
        paymentMethod: 'Stripe (pending)',
      };
      const idempotencyKey = crypto.randomUUID();
      const preOrderRes = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(orderPayload),
      });
      const preJson: unknown = await preOrderRes.json().catch(() => null);
      if (!preOrderRes.ok) {
        toast.error(formatOrderApiError(preJson));
        setSubmitting(false);
        return;
      }
      const preData = preJson as {
        data?: { orderId?: string; shortOrderId?: string };
      };
      const createdOrderId = preData?.data?.orderId;
      const createdShortOrderId =
        preData?.data?.shortOrderId ?? createdOrderId;
      if (!createdOrderId) {
        toast.error('Could not create order before payment.');
        setSubmitting(false);
        return;
      }
      const successPath = `/web-app/order/${orderType}/${orderId}/success?orderId=${encodeURIComponent(
        createdShortOrderId ?? createdOrderId
      )}&restaurantSlug=${encodeURIComponent(slug)}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelPath = orderPathWithQuery(
        `/order/${orderType}/${orderId}/checkout`,
        orderInfo
      );
      const res = await axios.post<{ url: string }>(
        '/api/stripe/create-order-checkout-session',
        {
          amount: grandTotal,
          currency: 'eur',
          source: 'online',
          successPath,
          cancelPath,
          title: `Online order (${orderType === 'delivery' ? 'Delivery' : 'Pick-up'})`,
          description: `Order ${createdOrderId} · ${slug}`,
          metadata: {
            source: 'online',
            restaurantSlug: slug,
            orderType,
            orderId: createdOrderId,
          },
        }
      );
      if (!res.data?.url) {
        toast.error('Could not start payment checkout.');
        return;
      }
      window.location.assign(res.data.url);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: unknown } } };
      const msg = err.response?.data?.error;
      toast.error(
        typeof msg === 'string' ? msg : 'Could not start Stripe payment.'
      );
      setSubmitting(false);
    }
  };

  if (!cartHydrated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('preparingCheckout')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('loadingYourCart')}</p>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() =>
                router.push(
                  orderPathWithQuery(
                    `/order/${orderType}/${encodeURIComponent(orderId)}`,
                    orderInfo
                  )
                )
              }
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t('backToOrder')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('noItemsToCheckout')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{t('cartEmpty')}</p>
            <Button
              onClick={() =>
                router.push(
                  orderPathWithQuery(
                    `/order/${orderType}/${encodeURIComponent(orderId)}`,
                    orderInfo
                  )
                )
              }
              type="button"
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t('backToOrder')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('checkout')}</h1>
            <p className="text-muted-foreground">
              {orderType === 'delivery' ? 'Delivery' : 'Pick-Up'} order -{' '}
              {orderId}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 gap-2"
            onClick={() =>
              router.push(
                orderPathWithQuery(
                  `/order/${orderType}/${encodeURIComponent(orderId)}`,
                  orderInfo
                )
              )
            }
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('backToOrder')}
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('orderInformation')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  {orderInfo?.mode === 'delivery' ? (
                    <>
                      <div>
                        <strong>{t('deliveryAddress')}:</strong>{' '}
                        {orderInfo.address || 'N/A'}
                      </div>
                      <div>
                        <strong>{t('name')}:</strong> {orderInfo.addressName || 'N/A'}
                      </div>
                      <div>
                        <strong>{t('phoneLabel')}:</strong>{' '}
                        {orderInfo.customerPhone || 'N/A'}
                      </div>
                      <div>
                        <strong>{t('apartmentDoor')}:</strong>{' '}
                        {orderInfo.apartment || 'N/A'}
                      </div>
                      <div>
                        <strong>{t('gateCode')}:</strong>{' '}
                        {orderInfo.gateCode || 'N/A'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong>{t('pickupLocation')}:</strong>{' '}
                        {orderInfo?.storeName || 'N/A'}
                      </div>
                      <div>
                        <strong>{t('storeAddress')}:</strong>{' '}
                        {orderInfo?.storeAddress || 'N/A'}
                      </div>
                      <div>
                        <strong>{t('name')}:</strong> {orderInfo?.addressName || 'N/A'}
                      </div>
                      <div>
                        <strong>{t('phoneLabel')}:</strong>{' '}
                        {orderInfo?.customerPhone || 'N/A'}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('orderDetailsCard')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-sm font-semibold">{t('cutlery')}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t('cutleryHint')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={cutlery ? 'default' : 'outline'}
                    onClick={() => setCutlery((prev) => !prev)}
                    type="button"
                  >
                    {cutlery ? t('yes') : t('no')}
                  </Button>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold">{t('comment')}</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('commentPlaceholder')}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle>{t('basket')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cart.map((line) => (
                    <div key={line.lineId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <p className="font-medium">{line.productName}</p>
                        <p>€{lineTotal(line).toFixed(2)}</p>
                      </div>
                      {line.modifiers.length > 0 ? (
                        <div className="space-y-1">
                          {line.modifiers.map((m) => (
                            <p
                              key={m.attributeGroupId}
                              className="text-xs text-muted-foreground"
                            >
                              {m.groupName}:{' '}
                              {m.selections.map((s) => s.name).join(', ')}
                            </p>
                          ))}
                        </div>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        x{line.quantity}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('subtotal')}</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('serviceFees')}</span>
                    <span>€{SERVICE_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{t('total')}</span>
                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={() => void startStripePayment()}
                    type="button"
                    disabled={submitting}
                  >
                    {submitting
                      ? t('processing')
                      : t('payWithStripe', { amount: grandTotal.toFixed(2) })}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('confirmOrderHint')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('promotions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3">
                  <input id="promo-code" type="text" className="text-sm p-2 rounded-lg " placeholder={t('addPromoCode')} />
                  <Button type="button">{t('apply')}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
