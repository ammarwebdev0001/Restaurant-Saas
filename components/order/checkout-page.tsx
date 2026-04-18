'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { OrderInfo } from '@/components/order/order-types';
import { orderPathWithQuery } from '@/lib/order-search-params';

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

      const maybeLine = row as Partial<CartLine> & { lineId?: string; baseUnitPrice?: number };
      if (typeof maybeLine.lineId === 'string' && typeof maybeLine.baseUnitPrice === 'number') {
        out.push({
          lineId: maybeLine.lineId,
          menuItemId: String(maybeLine.menuItemId ?? ''),
          productName: String((maybeLine as any).productName ?? ''),
          description: (maybeLine as any).description ?? null,
          imageUrl: (maybeLine as any).imageUrl ?? null,
          baseUnitPrice: maybeLine.baseUnitPrice,
          quantity: Number(maybeLine.quantity ?? 1),
          modifiers: Array.isArray((maybeLine as any).modifiers) ? (maybeLine as any).modifiers : [],
          modifiersSignature: String(maybeLine.modifiersSignature ?? ''),
        });
        continue;
      }

      // Legacy: { product: {id,name,price,image,description...}, quantity }
      const legacy = row as any;
      if (legacy?.product?.id && typeof legacy.quantity === 'number' && typeof legacy.product.price === 'number') {
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

export default function CheckoutPageClient({ orderType, orderId, orderInfo }: CheckoutPageProps) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const router = useRouter();
  const [cutlery, setCutlery] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCart(parseCartFromStorage(localStorage.getItem(`cart-${orderId}`)));
  }, [orderId]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + lineTotal(item), 0), [cart]);
  const grandTotal = total + SERVICE_FEE;

  const confirmOrder = async () => {
    const slug = orderInfo?.restaurantSlug?.trim();
    if (!slug) {
      toast.error('Missing store link. Open the menu from your restaurant page, then checkout again.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post<{ data?: { orderId?: string } }>('/api/customer/orders', {
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

      const placedId = data?.data?.orderId;
      toast.success(
        placedId ? `Order placed. Reference: ${placedId}` : 'Order placed successfully.'
      );
      localStorage.removeItem(`cart-${orderId}`);
      router.push(`/web-app/${encodeURIComponent(slug)}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: unknown } } };
      const msg = err.response?.data?.error;
      const text =
        typeof msg === 'string'
          ? msg
          : msg && typeof msg === 'object' && 'formErrors' in (msg as object)
            ? 'Invalid order data'
            : 'Could not place order. Please try again.';
      toast.error(text);
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Items to Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Button
              onClick={() =>
                router.push(
                  orderPathWithQuery(`/order/${orderType}/${orderId}`, orderInfo)
                )
              }
              type="button"
            >
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            {orderType === 'delivery' ? 'Delivery' : 'Pick-Up'} order - {orderId}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  {orderInfo?.mode === 'delivery' ? (
                    <>
                      <div>
                        <strong>Delivery Address:</strong> {orderInfo.address || 'N/A'}
                      </div>
                      <div>
                        <strong>Name:</strong> {orderInfo.addressName || 'N/A'}
                      </div>
                      <div>
                        <strong>Apartment/Door:</strong> {orderInfo.apartment || 'N/A'}
                      </div>
                      <div>
                        <strong>Gate code:</strong> {orderInfo.gateCode || 'N/A'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong>Pickup location:</strong> {orderInfo?.storeName || 'N/A'}
                      </div>
                      <div>
                        <strong>Store address:</strong> {orderInfo?.storeAddress || 'N/A'}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-sm font-semibold">Cutlery</h3>
                    <p className="text-xs text-muted-foreground">Only ask for cutlery if you need it.</p>
                  </div>
                  <Button
                    size="sm"
                    variant={cutlery ? 'default' : 'outline'}
                    onClick={() => setCutlery((prev) => !prev)}
                    type="button"
                  >
                    {cutlery ? 'Yes' : 'No'}
                  </Button>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold">Comment</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Do you have a specific request regarding the order?"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promotions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3">
                  <span className="text-sm text-muted-foreground">Add a promo code</span>
                  <Button size="sm" type="button">
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle>Basket</CardTitle>
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
                            <p key={m.attributeGroupId} className="text-xs text-muted-foreground">
                              {m.groupName}: {m.selections.map((s) => s.name).join(', ')}
                            </p>
                          ))}
                        </div>
                      ) : null}
                      <p className="text-xs text-muted-foreground">x{line.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fees</span>
                    <span>€{SERVICE_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={() => void confirmOrder()}
                    type="button"
                    disabled={submitting}
                  >
                    {submitting ? 'Placing order…' : `Pay (€${grandTotal.toFixed(2)})`}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  By continuing, you confirm your order for pickup or delivery as shown above.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Secure payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Button variant="outline" size="sm" className="justify-start" type="button">
                    Bank Card / Swile
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" type="button">
                    Up Group
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" type="button">
                    Bimpli (Apetiz)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

