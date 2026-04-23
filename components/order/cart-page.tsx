'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { IconMinus, IconPlus, IconTrash } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { OrderInfo } from '@/components/order/order-types';
import {
  buildCustomerMenuRequestUrl,
  inferHostSubdomainForMenu,
} from '@/lib/customer-menu-client';
import { orderPathWithQuery } from '@/lib/order-search-params';
import { buildThemeCssVars } from '@/lib/restaurant-theme';

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

type CartPageProps = {
  orderType: 'delivery' | 'pickUp';
  orderId: string;
  orderInfo?: OrderInfo;
};

type CustomerMenuProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  salePrice: number | null;
  categoryId: string;
  offersFromThis?: {
    id: string;
    sortOrder: number;
    offeredItem: {
      id: string;
      name: string;
      description: string | null;
      imageUrl: string | null;
      price: number;
      salePrice: number | null;
    };
  }[];
};

type CustomerMenuCategory = {
  id: string;
  name: string;
  items: CustomerMenuProduct[];
};

type CustomerMenuRestaurant = {
  id: string;
  menus: CustomerMenuCategory[];
};

type CustomerMenuResponse =
  | {
      data: CustomerMenuRestaurant | null;
    }
  | CustomerMenuRestaurant;

type OfferedProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  unitPrice: number;
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

export default function CartPageClient({ orderType, orderId, orderInfo }: CartPageProps) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [menuRestaurant, setMenuRestaurant] = useState<CustomerMenuRestaurant | null>(null);
  const [offersOpen, setOffersOpen] = useState(false);
  const [themePrimaryColor, setThemePrimaryColor] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setCart(parseCartFromStorage(localStorage.getItem(`cart-${orderId}`)));
  }, [orderId]);

  const updateCart = (next: CartLine[]) => {
    setCart(next);
    localStorage.setItem(`cart-${orderId}`, JSON.stringify(next));
  };

  const adjustQuantity = (lineId: string, delta: number) => {
    const newCart = cart
      .map((item) => (item.lineId === lineId ? { ...item, quantity: item.quantity + delta } : item))
      .filter((item) => item.quantity > 0);
    updateCart(newCart);
  };

  const removeFromCart = (lineId: string) => {
    updateCart(cart.filter((item) => item.lineId !== lineId));
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + lineTotal(item), 0), [cart]);

  const offeredProducts: OfferedProduct[] = useMemo(() => {
    if (!menuRestaurant || cart.length === 0) return [];

    const byId = new Map<string, OfferedProduct>();

    for (const line of cart) {
      const product = menuRestaurant.menus
        .flatMap((c) => c.items)
        .find((p) => p.id === line.menuItemId);
      if (!product) continue;

      const offers = product.offersFromThis ?? [];
      for (const offer of offers) {
        const item = offer.offeredItem;
        // Skip products already in cart
        if (cart.some((l) => l.menuItemId === item.id)) continue;

        if (!byId.has(item.id)) {
          const base =
            item.salePrice != null &&
            item.salePrice > 0 &&
            item.salePrice < item.price
              ? item.salePrice
              : item.price;
          byId.set(item.id, {
            id: item.id,
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl,
            unitPrice: base,
          });
        }
      }
    }

    return Array.from(byId.values());
  }, [cart, menuRestaurant]);

  useEffect(() => {
    if (offeredProducts.length > 0) {
      setOffersOpen(true);
    }
  }, [offeredProducts.length]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const slug = orderInfo?.restaurantSlug?.trim();
        const store = orderInfo?.storeId?.trim();
        const subdomain = inferHostSubdomainForMenu();
        const lookup = slug
          ? `/api/customer/restaurant?slug=${encodeURIComponent(slug)}`
          : store || subdomain
            ? `/api/customer/restaurant?subdomain=${encodeURIComponent(
                store || subdomain || ''
              )}`
            : null;
        if (!lookup) return;
        const res = await fetch(lookup);
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));
        const c =
          typeof json?.data?.themePrimaryColor === 'string'
            ? json.data.themePrimaryColor.trim()
            : '';
        setThemePrimaryColor(c || null);
      } catch {
        // noop
      }
    };
    void loadTheme();
  }, [orderInfo?.restaurantSlug, orderInfo?.storeId]);

  const offersDialogVars = useMemo(() => {
    const primaryVars = buildThemeCssVars(themePrimaryColor);
    return {
      ...primaryVars,
      '--background': 'oklch(0.9383 0.0042 236.4993)',
      '--foreground': 'oklch(0.3211 0 0)',
      '--card': 'oklch(1 0 0)',
      '--card-foreground': 'oklch(0.3211 0 0)',
      '--popover': 'oklch(1 0 0)',
      '--popover-foreground': 'oklch(0.3211 0 0)',
      '--secondary': 'oklch(0.967 0.0029 264.5419)',
      '--secondary-foreground': 'oklch(0.4461 0.0263 256.8018)',
      '--muted': 'oklch(0.9846 0.0017 247.8389)',
      '--muted-foreground': 'oklch(0.551 0.0234 264.3637)',
      '--border': 'oklch(0.9022 0.0052 247.8822)',
      '--input': 'oklch(0.97 0.0029 264.542)',
      colorScheme: 'light',
    } as CSSProperties;
  }, [themePrimaryColor]);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const hostSubdomain = inferHostSubdomainForMenu();
        const queryStoreId =
          orderInfo?.storeId && orderInfo.storeId.trim().length > 0
            ? orderInfo.storeId.trim()
            : null;
        const menuUrl = buildCustomerMenuRequestUrl(
          orderInfo?.restaurantSlug,
          queryStoreId,
          hostSubdomain
        );

        if (!menuUrl) {
          setMenuRestaurant(null);
          return;
        }

        const res = await fetch(menuUrl);
        if (!res.ok) {
          setMenuRestaurant(null);
          return;
        }

        const payload = (await res.json()) as CustomerMenuResponse;
        const restaurant =
          'data' in payload
            ? (payload.data ?? null)
            : (payload as CustomerMenuRestaurant);
        setMenuRestaurant(restaurant);
      } catch {
        setMenuRestaurant(null);
      }
    };

    void loadMenu();
  }, [orderInfo?.storeId, orderInfo?.restaurantSlug]);

  const handleAddOffered = (p: OfferedProduct) => {
    const line: CartLine = {
      lineId:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `l${Date.now()}-${Math.random().toString(16).slice(2)}`,
      menuItemId: p.id,
      productName: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      baseUnitPrice: p.unitPrice,
      quantity: 1,
      modifiers: [],
      modifiersSignature: '',
    };
    const next = [...cart, line];
    updateCart(next);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          <p className="text-sm text-muted-foreground">
            {orderType === 'delivery' ? 'Delivery' : 'Pick-Up'} order - {orderId}
          </p>
        </div>

        {orderInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div>
                  <strong>Mode:</strong> {orderInfo.mode}
                </div>
                {orderInfo.mode === 'delivery' ? (
                  <>
                    <div>
                      <strong>Address:</strong> {orderInfo.address || 'N/A'}
                    </div>
                    <div>
                      <strong>Name:</strong> {orderInfo.addressName || 'N/A'}
                    </div>
                    <div>
                      <strong>Apartment:</strong> {orderInfo.apartment || 'N/A'}
                    </div>
                    <div>
                      <strong>Gate code:</strong> {orderInfo.gateCode || 'N/A'}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <strong>Store:</strong> {orderInfo.storeName || 'N/A'}
                    </div>
                    <div>
                      <strong>Store Address:</strong> {orderInfo.storeAddress || 'N/A'}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {cart.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Your cart is empty.</p>
              <Button
                className="mt-4"
                onClick={() =>
                  router.push(
                    orderPathWithQuery(`/order/${orderType}/${orderId}`, orderInfo)
                  )
                }
                type="button"
              >
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 space-y-4">
              {cart.map((line) => (
                <Card key={line.lineId}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4 min-w-0">
                      {line.imageUrl ? (
                        <img src={line.imageUrl} alt={line.productName} className="h-16 w-16 rounded object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold">{line.productName}</h3>
                        {line.description ? <p className="text-sm text-muted-foreground">{line.description}</p> : null}
                        {line.modifiers.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {line.modifiers.map((m) => (
                              <p key={m.attributeGroupId} className="text-xs text-muted-foreground">
                                {m.groupName}: {m.selections.map((s) => s.name).join(', ')}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-2 text-xs text-muted-foreground">Unit: €{lineUnitTotal(line).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustQuantity(line.lineId, -1)}
                        disabled={line.quantity <= 1}
                        type="button"
                      >
                        <IconMinus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{line.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustQuantity(line.lineId, 1)}
                        type="button"
                      >
                        <IconPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(line.lineId)}
                        type="button"
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>

                      <div className="ml-auto text-right font-semibold sm:ml-4">
                        €{lineTotal(line).toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold">€{total.toFixed(2)}</span>
                </div>
                {offeredProducts.length > 0 ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    onClick={() => setOffersOpen(true)}
                  >
                    View recommended add-ons
                  </Button>
                ) : null}
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(
                      orderPathWithQuery(
                        `/order/${orderType}/${orderId}/checkout`,
                        orderInfo
                      )
                    )
                  }
                  type="button"
                >
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={offersOpen} onOpenChange={setOffersOpen}>
        <DialogContent
          className="border-border bg-background text-foreground"
          style={offersDialogVars}
        >
          <DialogHeader>
            <DialogTitle>Recommended add-ons</DialogTitle>
          </DialogHeader>
          {offeredProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No extra products are available for this cart.
            </p>
          ) : (
            <div className="max-h-80 space-y-3 overflow-y-auto py-1">
              {offeredProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {p.description ? (
                        <div className="text-xs text-muted-foreground">
                          {p.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      €{p.unitPrice.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => handleAddOffered(p)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOffersOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

