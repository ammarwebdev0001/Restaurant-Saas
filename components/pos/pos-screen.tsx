'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, FolderOpen, Plus, Search, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import axios from 'axios';
import eventBus from '@/lib/even';
import { usePosCartGuard } from '@/components/pos/pos-cart-guard-context';

export type OrderMode = 'new' | 'tables' | 'delivery' | 'takeaway' | 'queue';

type Product = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  variations?: {
    id: string;
    name?: string;
    title?: string;
    imageUrl?: string | null;
    swatchHex?: string | null;
    priceDelta: number;
  }[];
};

type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
  lineDiscPct: number;
  variationId?: string | null;
  variationName?: string | null;
};

/** `all` shows every product; other ids match `Product.categoryId`. */
type Category = {
  id: string;
  label: string;
};

type RestaurantMenuApi = {
  data?: {
    menus?: Array<{
      id: string;
      name: string;
      items?: Array<{
        id: string;
        name: string;
        price: number | string | null;
        salePrice: number | string | null;
        variations?: Array<{
          id: string;
          name?: string;
          title?: string;
          imageUrl?: string | null;
          swatchHex?: string | null;
          priceDelta: number | string | null;
        }>;
      }>;
    }>;
  };
};

const DEMO_TABLES = ['T1', 'T2', 'T3', 'T4', 'T5', 'Patio 1'];

function formatMoney(n: number) {
  return n.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PosScreen() {
  const { setPosCartHasItems } = usePosCartGuard();
  const [orderMode, setOrderMode] = useState<OrderMode>('tables');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([
    { id: 'all', label: 'ALL' },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [tableId, setTableId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [branch] = useState('SIX BRANCH');

  const [srChPct, setSrChPct] = useState('0');
  const [taxPct, setTaxPct] = useState('0');
  const [disPct, setDisPct] = useState('0');

  const [paymentMode, setPaymentMode] = useState('cash');
  const [payment, setPayment] = useState('');
  const [kotNote, setKotNote] = useState('');
  const [kdsPrint, setKdsPrint] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [swatchDialogOpen, setSwatchDialogOpen] = useState(false);
  const [swatchProduct, setSwatchProduct] = useState<Product | null>(null);
  const [swatchId, setSwatchId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function loadMenu() {
      setLoadingMenu(true);
      try {
        const res = await fetch('/api/restaurant/menu', {
          method: 'GET',
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to load menu');
        const json = (await res.json()) as RestaurantMenuApi;
        const menus = json.data?.menus ?? [];

        const nextCategories: Category[] = [{ id: 'all', label: 'ALL' }];
        const nextProducts: Product[] = [];

        for (const menu of menus) {
          nextCategories.push({
            id: menu.id,
            label: String(menu.name || 'UNNAMED').toUpperCase(),
          });
          for (const item of menu.items ?? []) {
            const sale = Number(item.salePrice);
            const base = Number(item.price);
            const price =
              Number.isFinite(sale) && sale > 0
                ? sale
                : Number.isFinite(base)
                  ? base
                  : 0;
            nextProducts.push({
              id: item.id,
              name: item.name,
              price,
              categoryId: menu.id,
              variations: (item.variations ?? []).map((v) => ({
                id: v.id,
                name: v.name,
                title: v.title,
                imageUrl: v.imageUrl ?? null,
                swatchHex: v.swatchHex ?? null,
                priceDelta: Number(v.priceDelta ?? 0),
              })),
            });
          }
        }

        if (!isMounted) return;
        setCategories(nextCategories);
        setProducts(nextProducts);
      } catch {
        if (!isMounted) return;
        setCategories([{ id: 'all', label: 'ALL' }]);
        setProducts([]);
        toast.error('Failed to load menu products for POS.');
      } finally {
        if (isMounted) setLoadingMenu(false);
      }
    }

    void loadMenu();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setPosCartHasItems(cart.length > 0);
    return () => setPosCartHasItems(false);
  }, [cart, setPosCartHasItems]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cart.length === 0) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const inCategory = categoryId === 'all' || p.categoryId === categoryId;
      if (!inCategory) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q);
    });
  }, [categoryId, products, search]);

  const itemsCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, line) => {
      const gross = line.unitPrice * line.qty;
      const disc = gross * (line.lineDiscPct / 100);
      return sum + (gross - disc);
    }, 0);
  }, [cart]);

  const srPct = Number(srChPct) || 0;
  const txPct = Number(taxPct) || 0;
  const dcPct = Number(disPct) || 0;

  const srChAmount = subtotal * (srPct / 100);
  const afterSr = subtotal + srChAmount;
  const taxAmount = afterSr * (txPct / 100);
  const disAmount = subtotal * (dcPct / 100);
  const grandTotal = Math.max(0, afterSr + taxAmount - disAmount);

  const paymentNum = Number(payment) || 0;
  const cashBack =
    paymentMode === 'cash' && paymentNum > grandTotal
      ? paymentNum - grandTotal
      : 0;

  const paymentEntered = payment.trim() !== '';
  const canSaveOrder = cart.length > 0 && paymentEntered && !savingOrder;
  const isTableMode = orderMode === 'tables';
  const isDeliveryMode = orderMode === 'delivery';

  function printOrderReceipt(orderRef: string) {
    if (typeof window === 'undefined') return;
    const receipt = window.open('', '_blank', 'width=420,height=720');
    if (!receipt) {
      toast.warn('Popup blocked. Allow popups to print receipt.');
      return;
    }

    const rows = cart
      .map((line) => {
        const gross = line.unitPrice * line.qty;
        const discAmt = gross * (line.lineDiscPct / 100);
        const lineTotal = gross - discAmt;
        return `<tr>
          <td>${line.name}</td>
          <td style="text-align:center;">${line.qty}</td>
          <td style="text-align:right;">${formatMoney(lineTotal)}</td>
        </tr>`;
      })
      .join('');

    const html = `<!doctype html>
<html>
  <head>
    <title>Order Receipt</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
      h2 { margin: 0 0 8px; }
      .muted { color: #555; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border-bottom: 1px solid #ddd; padding: 6px 4px; font-size: 12px; }
      .totals { margin-top: 10px; font-size: 12px; }
      .totals div { display:flex; justify-content:space-between; margin-top: 2px; }
      .grand { font-weight: bold; font-size: 14px; margin-top: 6px; }
    </style>
  </head>
  <body>
    <h2>${branch}</h2>
    <div class="muted">Order: ${orderRef}</div>
    <div class="muted">Mode: ${orderMode}</div>
    ${tableId ? `<div class="muted">Table: ${tableId}</div>` : ''}
    ${customerName ? `<div class="muted">Customer: ${customerName}</div>` : ''}
    ${customerPhone ? `<div class="muted">Phone: ${customerPhone}</div>` : ''}
    ${orderAddress ? `<div class="muted">Address: ${orderAddress}</div>` : ''}
    ${kotNote ? `<div class="muted">Note: ${kotNote}</div>` : ''}
    <table>
      <thead>
        <tr><th style="text-align:left;">Item</th><th>Qty</th><th style="text-align:right;">Amount</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
      <div><span>Tax</span><span>${formatMoney(taxAmount)}</span></div>
      <div><span>Discount</span><span>${formatMoney(disAmount)}</span></div>
      <div class="grand"><span>Grand Total</span><span>${formatMoney(grandTotal)}</span></div>
    </div>
  </body>
</html>`;
    receipt.document.open();
    receipt.document.write(html);
    receipt.document.close();
    receipt.focus();
    receipt.print();
  }

  function addProduct(p: Product, swatch?: { id: string; name: string; price: number } | null) {
    const productId = swatch ? `${p.id}::sw:${swatch.id}` : p.id;
    const unitPrice = swatch ? swatch.price : p.price;
    const displayName = swatch ? `${p.name} (${swatch.name})` : p.name;
    if (p.price <= 0) {
      toast.info('Open modifiers from staff menu — price is 0 for this item.');
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productId,
          name: displayName,
          unitPrice,
          qty: 1,
          lineDiscPct: 0,
          variationId: swatch?.id ?? null,
          variationName: swatch?.name ?? null,
        },
      ];
    });
  }

  function requestAddProduct(p: Product) {
    if ((p.variations?.length ?? 0) === 0) {
      addProduct(p, null);
      return;
    }
    setSwatchProduct(p);
    setSwatchId('');
    setSwatchDialogOpen(true);
  }

  function setQty(productId: string, qty: number) {
    if (qty < 1) {
      setCart((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, qty } : l))
    );
  }

  function setLineDisc(productId: string, pct: number) {
    const v = Math.min(100, Math.max(0, pct));
    setCart((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, lineDiscPct: v } : l
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  async function saveOrder() {
    if (cart.length === 0) {
      toast.warn('Add at least one product to the cart.');
      return;
    }
    if (!payment.trim()) {
      toast.warn('Enter the payment amount before saving.');
      return;
    }
    const nameTrim = customerName.trim();
    const phoneTrim = customerPhone.trim();
    const tableTrim = tableId.trim();
    const addressTrim = orderAddress.trim();
    if (nameTrim && !phoneTrim) {
      toast.warn(
        'Enter customer phone to save customer details, or clear the name.'
      );
      return;
    }
    if (isTableMode && !tableTrim) {
      toast.warn('Select a table for table orders.');
      return;
    }
    if (isDeliveryMode && (!addressTrim || !phoneTrim)) {
      toast.warn('Delivery requires customer phone and address.');
      return;
    }
    setSavingOrder(true);
    try {
      const res = await axios.post<{ id?: string }>(
        '/api/restaurant/pos-order',
        {
          grandTotal,
          payment: payment.trim(),
          paymentMode,
          address: addressTrim || undefined,
          taxAmount,
          discountAmount: disAmount,
          customerName: nameTrim || undefined,
          customerPhone: phoneTrim || undefined,
          tableId: tableTrim || undefined,
          orderMode,
          items: cart.map((l) => ({
            productId: l.productId,
            name: l.name,
            qty: l.qty,
            unitPrice: l.unitPrice,
            lineDiscPct: l.lineDiscPct,
          })),
        }
      );
      const orderRef = res.data?.id || `POS-${Date.now()}`;
      toast.success(
        `Order saved — ${itemsCount} items · PKR ${formatMoney(grandTotal)} · ${paymentMode}`
      );
      if (kdsPrint) {
        printOrderReceipt(orderRef);
      }
      eventBus.emit('refreshSalesOrders');
      clearCart();
      setPayment('');
      setOrderAddress('');
      setCustomerName('');
      setCustomerPhone('');
      setTableId('');
      setShowSaveConfirm(false);
    } catch (e: unknown) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? String(e.response.data.error)
          : 'Could not save POS order.';
      toast.error(msg);
    } finally {
      setSavingOrder(false);
    }
  }

  const modeButtons: { id: OrderMode; label: string; suffix?: string }[] = [
    { id: 'new', label: 'New Order', suffix: '+' },
    { id: 'tables', label: 'Tables', suffix: '+' },
    { id: 'delivery', label: 'Delivery', suffix: '+' },
    { id: 'takeaway', label: 'Take Away', suffix: '+' },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      {/* Top bar */}

      <div className="flex flex-col flex-1 gap-3 py-3 px-3 border-b bg-muted/30">
        <div className="flex justify-between flex-1 gap-3  px-3 sm:px-4">
          <div className="relative w-full max-w-xl lg:max-w-2xl">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                categoryId === 'all'
                  ? 'Search all products…'
                  : 'Search in this category…'
              }
              className="h-10 bg-background pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {modeButtons.map((b) => {
              const active = orderMode === b.id;
              return (
                <Button
                  key={b.id}
                  type="button"
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-9 gap-2 w-fit rounded-lg',
                    active && 'shadow-sm'
                  )}
                  onClick={() => setOrderMode(b.id)}
                >
                  {active && <Check className="h-3.5 w-3.5" aria-hidden />}
                  {b.label}
                  {b.suffix ? (
                    <span className="text-xs opacity-80">{b.suffix}</span>
                  ) : null}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {categories.map((c) => (
            <Button
              key={c.id}
              type="button"
              variant={categoryId === c.id ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'shrink-0 rounded-full px-4 text-xs font-semibold',
                categoryId === c.id &&
                  'bg-primary/15 text-primary ring-1 ring-primary/30'
              )}
              onClick={() => setCategoryId(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_minmax(300px,380px)]">
        {/* Products */}
        <ScrollArea className="min-h-0 border-b lg:border-b-0 lg:border-r">
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => requestAddProduct(p)}
                className="group flex flex-col items-center gap-2 rounded-xl border bg-background p-3 text-center transition hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-inner ring-2 ring-primary/20 transition group-hover:scale-[1.02]">
                  <FolderOpen
                    className="h-7 w-7 opacity-95"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="line-clamp-2 text-[11px] font-semibold leading-tight">
                  {p.name}
                </span>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  {formatMoney(p.price)}
                </span>
              </button>
            ))}
            {loadingMenu ? (
              <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                Loading menu products...
              </div>
            ) : (
              filteredProducts.length === 0 && (
                <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                  No products match this category or search.
                </div>
              )
            )}
          </div>
        </ScrollArea>

        {/* Checkout */}
        <div className="flex min-h-0 flex-col gap-3 border-t bg-muted/20 p-3 lg:border-t-0">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Branch</label>
              <Input
                readOnly
                className="h-9 bg-muted/50 text-sm font-medium"
                value={branch}
              />
            </div>
            {isTableMode ? (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Select Table
                </label>
                <Select value={tableId} onValueChange={setTableId}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_TABLES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Order mode
                </label>
                <Input
                  readOnly
                  className="h-9 bg-muted/50 text-sm font-medium"
                  value={orderMode.toUpperCase()}
                />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Customer name
            </label>
            <div className="flex gap-1">
              <Input
                className="h-9 flex-1 bg-background"
                placeholder="Name (optional if no phone)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-9 w-9 shrink-0 bg-primary/15 text-primary hover:bg-primary/25"
                aria-label="Add customer"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {(isDeliveryMode ||
            customerPhone.trim() !== '' ||
            customerName.trim() !== '') && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Customer phone
              </label>
              <Input
                className="h-9 bg-background"
                inputMode="tel"
                autoComplete="tel"
                placeholder={
                  isDeliveryMode
                    ? 'Phone (required for delivery)'
                    : 'Phone (optional)'
                }
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Same phone for this restaurant reuses the customer; name updates
                if you change it.
              </p>
            </div>
          )}

          {isDeliveryMode && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Delivery address
              </label>
              <textarea
                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter delivery address"
                value={orderAddress}
                onChange={(e) => setOrderAddress(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <div className="min-h-[140px] flex-1 overflow-hidden rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40%] text-xs">Items</TableHead>
                  <TableHead className="text-center text-xs">Qty</TableHead>
                  <TableHead className="text-center text-xs">Disc</TableHead>
                  <TableHead className="text-right text-xs">Price</TableHead>
                  <TableHead className="w-8 p-1" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No Products in Cart!
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map((line) => {
                    const gross = line.unitPrice * line.qty;
                    const discAmt = gross * (line.lineDiscPct / 100);
                    const lineTotal = gross - discAmt;
                    return (
                      <TableRow key={line.productId}>
                        <TableCell className="max-w-[140px] truncate text-xs font-medium">
                          {line.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-0.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                setQty(line.productId, line.qty - 1)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-xs tabular-nums">
                              {line.qty}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                setQty(line.productId, line.qty + 1)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            className="h-7 px-1 text-center text-xs"
                            inputMode="decimal"
                            value={line.lineDiscPct || ''}
                            placeholder="0"
                            onChange={(e) =>
                              setLineDisc(
                                line.productId,
                                Number(e.target.value) || 0
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {formatMoney(lineTotal)}
                        </TableCell>
                        <TableCell className="p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() =>
                              setCart((prev) =>
                                prev.filter(
                                  (l) => l.productId !== line.productId
                                )
                              )
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Items Count:</span>
              <span className="tabular-nums text-foreground">{itemsCount}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="tabular-nums text-foreground">
                {formatMoney(subtotal)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground">
                  Tax %
                </label>
                <Input
                  className="h-8 text-xs"
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground">
                  Tax
                </label>
                <Input
                  className="h-8 text-xs"
                  readOnly
                  value={formatMoney(taxAmount)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground">
                  Dis %
                </label>
                <Input
                  className="h-8 text-xs"
                  value={disPct}
                  onChange={(e) => setDisPct(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground">
                  Dis
                </label>
                <Input
                  className="h-8 text-xs"
                  readOnly
                  value={formatMoney(disAmount)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground shadow-md">
            <span className="font-semibold">Grand Total</span>
            <span className="text-lg font-bold tabular-nums">
              PKR {formatMoney(grandTotal)}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Payment Mode
              </label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Payment</label>
              <Input
                className="h-9 bg-background"
                inputMode="decimal"
                placeholder="0.00"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full text-xs"
                onClick={() => setPayment(grandTotal.toFixed(2))}
              >
                Full payment
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">KOT Note</label>
            <Input
              className="h-9 bg-background"
              placeholder="Kitchen note"
              value={kotNote}
              onChange={(e) => setKotNote(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Cash Back: </span>
              <span className="font-medium tabular-nums">
                PKR {formatMoney(cashBack)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={kdsPrint}
                  onChange={(e) => setKdsPrint(e.target.checked)}
                />
                KDS Print
              </label>
            </div>
          </div>

          <div className="mt-auto flex w-full min-w-0 flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="default"
              className="min-w-[min(100%,10rem)] flex-1"
              disabled={!canSaveOrder}
              title={
                !paymentEntered
                  ? 'Enter payment amount to save'
                  : cart.length === 0
                    ? 'Add items to the cart'
                    : undefined
              }
              onClick={() => {
                if (canSaveOrder) setShowSaveConfirm(true);
              }}
            >
              {savingOrder ? 'Saving…' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-w-[min(100%,10rem)] flex-1"
              onClick={clearCart}
            >
              Clear cart
            </Button>
          </div>
        </div>
      </div>
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save POS order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save the current cart as an order.
              {kdsPrint ? ' Receipt print preview will open after save.' : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={savingOrder}
              onClick={() => void saveOrder()}
            >
              {savingOrder ? 'Saving…' : 'Confirm Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={swatchDialogOpen} onOpenChange={setSwatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select swatch</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <label className="text-xs text-muted-foreground">Swatch</label>
            <Select value={swatchId} onValueChange={setSwatchId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose swatch" />
              </SelectTrigger>
              <SelectContent>
                {(swatchProduct?.variations ?? []).map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {(v.name ?? v.title ?? 'Swatch') + ` - ${formatMoney(Number(v.priceDelta ?? 0))}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSwatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!swatchId || !swatchProduct}
              onClick={() => {
                if (!swatchProduct) return;
                const picked = (swatchProduct.variations ?? []).find((v) => v.id === swatchId);
                if (!picked) return;
                addProduct(swatchProduct, {
                  id: picked.id,
                  name: picked.name ?? picked.title ?? 'Swatch',
                  price: Number(picked.priceDelta ?? 0),
                });
                setSwatchDialogOpen(false);
                setSwatchProduct(null);
                setSwatchId('');
              }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
