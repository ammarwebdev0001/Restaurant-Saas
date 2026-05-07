'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Eye } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { orderSourceLabel } from '@/lib/order-source-label';
import eventBus from '@/lib/even';
import type {
  SalesOrderRow,
  SalesOrdersApiResponse,
  SalesOrdersStats,
} from '@/types/sales-order';
import type { TransactionData } from '@/types/transaction';
import { cn } from '@/lib/utils';

function formatMoney(n: number | null) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-IE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type MenuOrderDetail = {
  id: string;
  shortOrderId?: string;
  total: number;
  status: string;
  sourceType: string;
  address: string | null;
  taxAmount: number;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    menuItem: { id: string; name: string };
    modifiers?: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
    createdAt: string;
  }>;
};

const emptyStats: SalesOrdersStats = {
  online: { count: 0, totalAmount: 0 },
  pos: { count: 0, totalAmount: 0 },
  kiosk: { count: 0, totalAmount: 0 },
  all: { count: 0, totalAmount: 0 },
};

function OrdersTable({
  rows,
  onView,
}: {
  rows: SalesOrderRow[];
  onView: (row: SalesOrderRow) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">Sr</TableHead>
            <TableHead className="w-[50px]">Token</TableHead>
            <TableHead className="w-[100px] text-center">Ticket #</TableHead>
            <TableHead className="hidden sm:table-cell">Source</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Payment</TableHead>
            <TableHead className="hidden lg:table-cell">When</TableHead>
            {/* <TableHead className="hidden md:table-cell text-center">
              Transaction
            </TableHead> */}
            <TableHead className="w-[72px] text-right"> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={11}
                className="text-center text-muted-foreground"
              >
                No orders in this tab.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={`${row.kind}-${row.id}`}>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="max-w-[140px] truncate font-mono text-xs">
                  {row.trackingToken ?? row.id}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.ticketNumber != null ? `#${row.ticketNumber}` : '—'}
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="font-normal">
                    {orderSourceLabel(row.sourceType)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  €{formatMoney(row.total)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {row.status}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {'paymentStatus' in row ? row.paymentStatus ?? '—' : '—'}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {new Date(row.createdAt).toLocaleString()}
                </TableCell>
                {/* <TableCell className="hidden text-center md:table-cell">
                  {row.transactionId ? (
                    <Button
                      asChild
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <Link
                        href={`/records/${encodeURIComponent(row.transactionId)}`}
                      >
                        Transaction
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell> */}
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2"
                    onClick={() => onView(row)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function SalesOrdersTabs() {
  const [onlineOrders, setOnlineOrders] = useState<SalesOrderRow[]>([]);
  const [posOrders, setPosOrders] = useState<SalesOrderRow[]>([]);
  const [kioskOrders, setKioskOrders] = useState<SalesOrderRow[]>([]);
  const [stats, setStats] = useState<SalesOrdersStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'online' | 'pos' | 'kiosk'>(
    'online'
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<SalesOrderRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [menuDetail, setMenuDetail] = useState<MenuOrderDetail | null>(null);
  const [transactionLines, setTransactionLines] = useState<TransactionData[]>(
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<SalesOrdersApiResponse>(
        '/api/restaurant/sales-orders'
      );
      setOnlineOrders(res.data.onlineOrders ?? []);
      setPosOrders(res.data.posOrders ?? []);
      setKioskOrders(res.data.kioskOrders ?? []);
      setStats(res.data.stats ?? emptyStats);
    } catch {
      setError('Could not load orders.');
      setOnlineOrders([]);
      setPosOrders([]);
      setKioskOrders([]);
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    eventBus.on('refreshSalesOrders', handler);
    return () => {
      eventBus.removeListener('refreshSalesOrders', handler);
    };
  }, [load]);

  async function openDetail(row: SalesOrderRow) {
    setActiveRow(row);
    setSheetOpen(true);
    setDetailLoading(true);
    setMenuDetail(null);
    setTransactionLines([]);

    try {
      if (row.kind === 'menu_order') {
        const res = await axios.get<MenuOrderDetail>(
          `/api/restaurant/orders/${row.id}`
        );
        setMenuDetail(res.data);
      } else {
        const res = await axios.get<TransactionData[]>(
          `/api/transactions/${row.id}`
        );
        const data = res.data;
        setTransactionLines(Array.isArray(data) ? data : []);
      }
    } catch {
      setMenuDetail(null);
      setTransactionLines([]);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeSheet(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      setActiveRow(null);
      setMenuDetail(null);
      setTransactionLines([]);
    }
  }

  const activeStats =
    activeTab === 'online'
      ? stats.online
      : activeTab === 'pos'
        ? stats.pos
        : stats.kiosk;
  const activeLabel =
    activeTab === 'online' ? 'Online' : activeTab === 'pos' ? 'POS' : 'Kiosk';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 w-full">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {activeLabel} — orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {loading ? '…' : activeStats.count}
            </p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {activeLabel} — total amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {loading ? '…' : `€${formatMoney(activeStats.totalAmount)}`}
            </p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total — orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {loading ? '…' : stats.all.count}
            </p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total — total amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {loading ? '…' : `€${formatMoney(stats.all.totalAmount)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
          <div>
            <p className="text-sm text-muted-foreground w-full">
              {loading ? 'Loading…' : ''}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={loading}
            onClick={() => load()}
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Tabs
            defaultValue="online"
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full max-w-full grid-cols-1 gap-1 sm:grid-cols-3">
              <TabsTrigger value="online">Online orders</TabsTrigger>
              <TabsTrigger value="pos">POS orders</TabsTrigger>
              <TabsTrigger value="kiosk">Kiosk orders</TabsTrigger>
            </TabsList>
            <TabsContent value="online" className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                Checkout orders with source <strong>Online</strong>.
              </p>
              {loading && onlineOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <OrdersTable rows={onlineOrders} onView={openDetail} />
              )}
            </TabsContent>
            <TabsContent value="pos" className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                POS menu orders, other in-store menu orders, and register /
                walk-in transactions.
              </p>
              {loading && posOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <OrdersTable rows={posOrders} onView={openDetail} />
              )}
            </TabsContent>
            <TabsContent value="kiosk" className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                Orders placed from the in-venue <strong>kiosk</strong>.
              </p>
              {loading && kioskOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <OrdersTable rows={kioskOrders} onView={openDetail} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={closeSheet}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Order details</SheetTitle>
            
          </SheetHeader>

          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            {detailLoading && (
              <p className="text-sm text-muted-foreground">Loading details…</p>
            )}

            {!detailLoading &&
              activeRow?.kind === 'menu_order' &&
              !menuDetail && (
                <p className="text-sm text-destructive">
                  Could not load order details.
                </p>
              )}

            {!detailLoading &&
              activeRow?.kind === 'menu_order' &&
              menuDetail && (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-muted-foreground">Tracking ID</p>
                      <p className="font-mono text-xs">
                        {menuDetail.shortOrderId ?? menuDetail.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold tabular-nums">
                        €{formatMoney(menuDetail.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{menuDetail.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Source</p>
                      <p>{orderSourceLabel(menuDetail.sourceType)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Placed</p>
                      <p>{new Date(menuDetail.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment status</p>
                      <p className="font-medium">
                        {menuDetail.payments[0]?.status ?? '—'}
                      </p>
                    </div>
                    {/* <div>
                      <p className="text-muted-foreground">Transaction ID</p>
                      <p className="font-mono text-xs">
                        {activeRow.transactionId ??
                          menuDetail.payments[0]?.id ??
                          menuDetail.id}
                      </p>
                    </div> */}
                  </div>

                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Financial summary
                    </p>
                    <p>Tax: €{formatMoney(menuDetail.taxAmount)}</p>
                    <p>Discount: €{formatMoney(menuDetail.discountAmount)}</p>
                  </div>

                  {menuDetail.customer && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Customer
                      </p>
                      <p className="font-medium">{menuDetail.customer.name}</p>
                      <p className="text-muted-foreground">
                        {menuDetail.customer.phone}
                      </p>
                      {menuDetail.customer.email && (
                        <p className="text-muted-foreground">
                          {menuDetail.customer.email}
                        </p>
                      )}
                    </div>
                  )}

                  {menuDetail.address ? (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Address snapshot
                      </p>
                      <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                        {menuDetail.address}
                      </pre>
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-2 font-medium">Line items</p>
                    {menuDetail.items.length === 0 ? (
                      <p className="text-muted-foreground">
                        No line items stored.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">Sr</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {menuDetail.items.map((it, i) => (
                            <TableRow key={it.id}>
                              <TableCell className="tabular-nums text-muted-foreground">
                                {i + 1}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <p>{it.menuItem.name}</p>
                                  {(it.modifiers ?? []).map((m) => (
                                    <p
                                      key={m.id}
                                      className="pl-3 text-xs text-muted-foreground"
                                    >
                                      <span className="font-semibold tabular-nums">
                                        {m.quantity}×
                                      </span>{' '}
                                      {m.name}
                                    </p>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {it.quantity}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                €{formatMoney(it.price)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {menuDetail.payments.length > 0 && (
                    <div>
                      <p className="mb-2 font-medium">Payments</p>
                      <ul className="space-y-1 text-muted-foreground">
                        {menuDetail.payments.map((p) => (
                          <li key={p.id}>
                            €{formatMoney(p.amount)} · {p.method} · {p.status}{' '}
                            <span className="text-xs">
                              ({new Date(p.createdAt).toLocaleString()})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            {!detailLoading &&
              activeRow?.kind === 'sale_transaction' &&
              (transactionLines.length === 0 ? (
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    No product lines for this register transaction (header-only
                    or legacy).
                  </p>
                  <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold tabular-nums">
                        €{formatMoney(activeRow.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p>{activeRow.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Source</p>
                      <p>{orderSourceLabel(activeRow.sourceType)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">When</p>
                      <p>{new Date(activeRow.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Transaction ID
                      </p>
                      <p className="font-mono text-xs">
                        {activeRow.transactionId ?? activeRow.id}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">Line items</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">Sr</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionLines.map((line, i) => {
                        const amt = line.product.sellprice * line.quantity;
                        return (
                          <TableRow key={line.id}>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {i + 1}
                            </TableCell>
                            <TableCell>
                              {line.product.productstock.name}
                            </TableCell>
                            <TableCell className="text-right">
                              {line.quantity}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              €{formatMoney(amt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
