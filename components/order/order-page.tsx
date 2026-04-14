'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  IconChevronLeft,
  IconChevronRight,
  IconShoppingBag,
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

import {
  ProductCustomizeDialog,
  type AttributeGroup,
  type MenuOption,
} from '@/components/order/product-customize-dialog';
import type { OrderInfo } from '@/components/order/order-types';
import {
  buildCustomerMenuRequestUrl,
  inferHostSubdomainForMenu,
} from '@/lib/customer-menu-client';
import { orderPathWithQuery } from '@/lib/order-search-params';

export type OrderPageProps = {
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
  attributeGroups: {
    id: string;
    name: string;
    selectionType: 'SINGLE' | 'MULTIPLE';
    required: boolean;
    linkedCategory: {
      id: string;
      name: string;
      items: {
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        price: number;
        salePrice: number | null;
      }[];
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

function effectiveUnitPrice(price: number, salePrice: number | null) {
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}

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
  modifiersSignature: string; // used to merge identical customizations
  offeredProductName?: string | null;
};

function getSignature(mods: CartModifierSelection[]) {
  return mods
    .slice()
    .sort((a, b) => a.attributeGroupId.localeCompare(b.attributeGroupId))
    .map(
      (m) =>
        `${m.attributeGroupId}:${m.selections
          .map((s) => s.menuItemId)
          .sort()
          .join(',')}`
    )
    .join('|');
}

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

      // New format
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
          offeredProductName: (maybeLine as any).offeredProductName ?? null,
        });
        continue;
      }

      // Legacy format: [{ product: {id,name,price,image,description...}, quantity }]
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

function OfferSlider({
  items,
  current,
  onPrev,
  onNext,
}: {
  items: OfferItem[];
  current: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[current] ?? items[0];
  if (!item) return null;
  return (
    <div className="relative mx-auto mb-8 max-w-7xl overflow-hidden rounded-2xl border border-border bg-card">
      <img
        src={item.image}
        alt={item.id}
        className="h-56 w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/30 p-6"></div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2">
        <Button variant="outline" size="icon" onClick={onPrev} type="button">
          <IconChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <Button variant="outline" size="icon" onClick={onNext} type="button">
          <IconChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

type OfferItem = {
  id: string;
  image: string;
};

function ProductCard({
  product,
  onAdd,
  showCustomizeIndicator,
}: {
  product: CustomerMenuProduct;
  onAdd: () => void;
  showCustomizeIndicator: boolean;
}) {
  const display = effectiveUnitPrice(product.price, product.salePrice);
  const hasSale =
    product.salePrice != null &&
    product.salePrice > 0 &&
    product.salePrice < product.price;

  return (
    <Card className="bg-card">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-muted text-muted-foreground">
          <IconShoppingBag className="h-10 w-10" />
        </div>
      )}
      <CardContent className="space-y-2">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        {product.description ? (
          <p className="text-sm text-muted-foreground">{product.description}</p>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="font-bold">
            {hasSale ? (
              <span className="mr-2 text-sm font-normal text-muted-foreground line-through">
                €{product.price.toFixed(2)}
              </span>
            ) : null}
            €{display.toFixed(2)}
          </span>
          <Button size="sm" onClick={onAdd} type="button">
            {showCustomizeIndicator ? 'Customize +' : 'Add +'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderPageClient({
  orderType,
  orderId,
  orderInfo,
}: OrderPageProps) {
  const [categories, setCategories] = useState<CustomerMenuCategory[]>([]);
  const [products, setProducts] = useState<CustomerMenuProduct[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState('');
  const [currentOffer, setCurrentOffer] = useState(0);
  const [bannerOffers, setBannerOffers] = useState<OfferItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const [menuLoading, setMenuLoading] = useState(false);

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeProduct, setCustomizeProduct] =
    useState<CustomerMenuProduct | null>(null);

  const { theme, resolvedTheme } = useTheme();
  const router = useRouter();

  const openCustomizeForProduct = (p: CustomerMenuProduct) => {
    setCustomizeProduct(p);
    setCustomizeOpen(true);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setCart(parseCartFromStorage(localStorage.getItem(`cart-${orderId}`)));
  }, [mounted, orderId]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(`cart-${orderId}`, JSON.stringify(cart));
  }, [cart, mounted, orderId]);

  useEffect(() => {
    if (!mounted) return;
    const loadBanners = async () => {
      try {
        let restaurantUrl: string | null = null;
        const slug = orderInfo?.restaurantSlug?.trim();
        if (slug) {
          restaurantUrl = `/api/customer/restaurant?slug=${encodeURIComponent(slug)}`;
        } else {
          const subdomain = inferHostSubdomainForMenu();
          const fallbackSub = orderInfo?.storeId?.trim() || subdomain;
          if (fallbackSub) {
            restaurantUrl = `/api/customer/restaurant?subdomain=${encodeURIComponent(
              fallbackSub
            )}`;
          }
        }
        if (!restaurantUrl) return;

        const res = await fetch(restaurantUrl);
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));
        const urls = Array.isArray(json?.data?.menuBannerUrls)
          ? (json.data.menuBannerUrls as string[]).filter(
              (u) => typeof u === 'string' && u.trim() !== ''
            )
          : [];
        if (urls.length === 0) return;

        const mapped = urls.map((image, idx) => ({
          id: `menu-banner-${idx + 1}`,
          image,
        }));
        setBannerOffers(mapped);
      } catch {
        // keep default static offers
      }
    };

    void loadBanners();
  }, [
    mounted,
    orderInfo?.restaurantSlug,
    orderInfo?.storeId,
    orderInfo?.restaurantName,
    orderInfo?.storeName,
  ]);

  useEffect(() => {
    if (bannerOffers.length === 0) return;
    setCurrentOffer((prev) => prev % bannerOffers.length);
  }, [bannerOffers]);

  const addToCart = (
    product: CustomerMenuProduct,
    modifiers: CartModifierSelection[]
  ) => {
    const baseUnitPrice = effectiveUnitPrice(product.price, product.salePrice);
    const modifiersSignature = getSignature(modifiers);

    setCart((current) => {
      const existing = current.find(
        (l) =>
          l.menuItemId === product.id &&
          l.modifiersSignature === modifiersSignature
      );
      if (existing) {
        return current.map((l) =>
          l.lineId === existing.lineId ? { ...l, quantity: l.quantity + 1 } : l
        );
      }

      const line: CartLine = {
        lineId:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `l${Date.now()}`,
        menuItemId: product.id,
        productName: product.name,
        description: product.description ?? null,
        imageUrl: product.imageUrl ?? null,
        baseUnitPrice,
        quantity: 1,
        modifiers,
        modifiersSignature,
      };

      return [...current, line];
    });
  };

  const hasRequiredAddons = (p: CustomerMenuProduct) =>
    p.attributeGroups.some((g) => g.required);

  const filteredProducts = useMemo(() => {
    const base = products.filter((p) => p.categoryId === selectedCategory);
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter((p) =>
      (p.name + ' ' + (p.description ?? '')).toLowerCase().includes(q)
    );
  }, [products, selectedCategory, search]);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + lineTotal(line), 0),
    [cart]
  );

  const adjustQuantity = (lineId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.lineId === lineId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (lineId: string) => {
    setCart((current) => current.filter((x) => x.lineId !== lineId));
  };

  const onCategoryClick = (id: string) => {
    setSelectedCategory(id);
  };

  useEffect(() => {
    if (!mounted) return;

    const loadMenu = async () => {
      try {
        setMenuLoading(true);

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
          setCategories([]);
          setProducts([]);
          return;
        }

        const res = await fetch(menuUrl);

        if (!res.ok) {
          console.error('Failed to load menu', await res.text());
          setCategories([]);
          setProducts([]);
          return;
        }

        const payload = (await res.json()) as CustomerMenuResponse;
        const restaurant =
          'data' in payload
            ? payload.data ?? null
            : (payload as CustomerMenuRestaurant);
        const menus =
          restaurant && Array.isArray(restaurant.menus) ? restaurant.menus : [];

        setCategories(menus);
        setProducts(
          menus.flatMap((cat) =>
            cat.items.map((item) => ({
              ...item,
              categoryId: cat.id,
            }))
          )
        );
      } catch (err) {
        console.error('Error loading customer menu', err);
        setCategories([]);
        setProducts([]);
      } finally {
        setMenuLoading(false);
      }
    };

    void loadMenu();
  }, [mounted, orderInfo?.storeId]);

  useEffect(() => {
    if (!selectedCategory && categories.length > 0)
      setSelectedCategory(categories[0].id);
  }, [categories, selectedCategory]);

  const attributeGroupsForDialog: AttributeGroup[] = useMemo(() => {
    if (!customizeProduct) return [];
    return customizeProduct.attributeGroups.map((g) => ({
      id: g.id,
      name: g.name,
      selectionType: g.selectionType,
      required: g.required,
      linkedCategoryName: g.linkedCategory?.name ?? null,
      items: g.linkedCategory.items.map((it) => ({
        menuItemId: it.id,
        name: it.name,
        description: it.description,
        imageUrl: it.imageUrl,
        price: it.price,
        salePrice: it.salePrice,
      })),
    }));
  }, [customizeProduct]);

  // Avoid server/client markup mismatches by rendering only after first mount.
  // Important: this must be AFTER all hooks to keep React Hook order stable.
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">
            {orderInfo?.restaurantName ?? 'Enjoy Tacos'}
          </h1>
          <div className="text-sm text-muted-foreground">
            {orderType === 'delivery' ? 'Delivery' : 'Pick-Up'} order -{' '}
            {orderId}
          </div>
          <div className="text-xs text-muted-foreground">
            Theme: {resolvedTheme || theme}
          </div>
        </div>

        <OfferSlider
          items={bannerOffers}
          current={currentOffer}
          onPrev={() =>
            setCurrentOffer(
              (p) => (p - 1 + bannerOffers.length) % bannerOffers.length
            )
          }
          onNext={() => setCurrentOffer((p) => (p + 1) % bannerOffers.length)}
        />

        {orderInfo && (
          <section className="mb-6 rounded-2xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold mb-2">Order details</h4>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Mode:</strong>{' '}
                {orderInfo.mode}
              </div>
              {orderInfo.mode === 'delivery' ? (
                <>
                  <div>
                    <strong className="text-foreground">Address:</strong>{' '}
                    {orderInfo.address || 'N/A'}
                  </div>
                  <div>
                    <strong className="text-foreground">Name:</strong>{' '}
                    {orderInfo.addressName || 'N/A'}
                  </div>
                  <div>
                    <strong className="text-foreground">Apartment:</strong>{' '}
                    {orderInfo.apartment || 'N/A'}
                  </div>
                  <div>
                    <strong className="text-foreground">Gate code:</strong>{' '}
                    {orderInfo.gateCode || 'N/A'}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <strong className="text-foreground">Store:</strong>{' '}
                    {orderInfo.storeName || 'N/A'}
                  </div>
                  <div>
                    <strong className="text-foreground">Store address:</strong>{' '}
                    {orderInfo.storeAddress || 'N/A'}
                  </div>
                  <div>
                    <strong className="text-foreground">Store id:</strong>{' '}
                    {orderInfo.storeId || 'N/A'}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <main>
            <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryClick(category.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground ring-1 ring-border hover:bg-primary/20'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full sm:w-96"
              />
              <Button
                className="whitespace-nowrap"
                onClick={() => setSearch('')}
                variant="outline"
                type="button"
              >
                Clear
              </Button>
            </div>

            {menuLoading ? (
              <p className="text-sm text-muted-foreground">Loading menu…</p>
            ) : (
              <>
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-semibold">All categories</h2>

                  { categories.length > 0 ? categories.map((category) => {
                    const categoryProducts = category.items.filter((p) => {
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return (p.name + ' ' + (p.description ?? ''))
                        .toLowerCase()
                        .includes(q);
                    });

                    if (categoryProducts.length === 0)
                      return (
                        <div className="mb-10">
                          <p className="text-sm text-muted-foreground">
                            No products found in this category
                          </p>
                        </div>
                      );

                    return (
                      <div key={category.id} id={category.id} className="mb-10">
                        <h3 className="text-lg font-bold mb-3">
                          {category.name}
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {categoryProducts.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              showCustomizeIndicator={hasRequiredAddons(
                                product
                              )}
                              onAdd={() => {
                                if (hasRequiredAddons(product))
                                  openCustomizeForProduct(product);
                                else addToCart(product, []);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="mb-10">
                      <p className="text-sm text-muted-foreground">
                        No categories found
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}
          </main>

          <aside className="sticky top-20 rounded-2xl border border-border bg-card p-4 max-h-[70vh]">
            <div className="flex h-full flex-col">
              <h3 className="text-lg font-semibold">Takeaway / Order Info</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Order type: {orderType}. Estimated takeaway time 20-30 mins.
              </p>

              <h4 className="text-lg font-bold mt-5">Cart</h4>
              <div className="mt-4 flex-1 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cart is empty
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cart.map((line) => (
                      <div
                        key={line.lineId}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {line.productName}
                          </p>
                          {line.modifiers.length > 0 ? (
                            <div className="mt-1 space-y-1">
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
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => adjustQuantity(line.lineId, -1)}
                              disabled={line.quantity <= 1}
                              type="button"
                            >
                              -
                            </Button>
                            <span>{line.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => adjustQuantity(line.lineId, 1)}
                              type="button"
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(line.lineId)}
                              type="button"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        <span>€{lineTotal(line).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-2 mt-2 text-sm font-bold flex items-center justify-between gap-2">
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() =>
                  router.push(
                    orderPathWithQuery(
                      `/order/${orderType}/${orderId}/cart`,
                      orderInfo
                    )
                  )
                }
                type="button"
                disabled={cart.length === 0}
              >
                View Order Details
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <ProductCustomizeDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        productName={customizeProduct?.name ?? 'Product'}
        attributeGroups={attributeGroupsForDialog}
        onConfirm={(mods) => {
          if (!customizeProduct) return;

          const cartMods: CartModifierSelection[] = mods.map((m) => ({
            attributeGroupId: m.attributeGroupId,
            groupName: m.groupName,
            selections: m.selections.map((s: MenuOption) => ({
              menuItemId: s.menuItemId,
              name: s.name,
              unitPrice: s.unitPrice,
            })),
          }));

          addToCart(customizeProduct, cartMods);
          setCustomizeOpen(false);
          setCustomizeProduct(null);
        }}
      />
    </div>
  );
}
