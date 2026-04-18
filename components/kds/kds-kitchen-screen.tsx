'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Ticket = {
  id: string;
  orderId: string;
  status: string;
  selectedMinutes: number;
  startedAt: string;
  createdAt: string;
  sourceType: string;
  orderTotal: number;
  customerName: string | null;
  items: { id: string; productName: string; quantity: number }[];
};

function fmt(v: number) {
  return v.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function remainingSeconds(
  startedAtIso: string,
  selectedMinutes: number,
  nowMs: number
) {
  const started = new Date(startedAtIso).getTime();
  const end = started + selectedMinutes * 60_000;
  return Math.floor((end - nowMs) / 1000);
}

function formatCountdown(sec: number) {
  const abs = Math.abs(sec);
  const mm = Math.floor(abs / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(abs % 60)
    .toString()
    .padStart(2, '0');
  return sec < 0 ? `-${mm}:${ss}` : `${mm}:${ss}`;
}

export function KdsKitchenScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeUpdatingTicketId, setActiveUpdatingTicketId] = useState<
    string | null
  >(null);
  const [activeUpdateCount, setActiveUpdateCount] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await axios.get<{ data: Ticket[] }>(
        '/api/restaurant/kds/tickets?status=making'
      );
      setTickets(res.data.data ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      void load();
    }, 8000);
    return () => clearInterval(t);
  }, [load]);

  const sorted = useMemo(
    () =>
      [...tickets].sort(
        (a, b) =>
          new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
      ),
    [tickets]
  );

  async function updateStatus(
    ticketId: string,
    status: 'completed' | 'canceled'
  ) {
    setActiveUpdateCount((prev) => prev + 1);
    setActiveUpdatingTicketId(ticketId);
    try {
      await axios.patch(`/api/restaurant/kds/tickets/${ticketId}`, { status });
      await load();
    } finally {
      setActiveUpdateCount((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          setActiveUpdatingTicketId(null);
        }
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Display</h1>
          <p className="text-sm text-muted-foreground">
            Showing all making orders
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void load()}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          Loading kitchen tickets...
        </p>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No active making orders.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((t) => {
            const left = remainingSeconds(
              t.startedAt,
              t.selectedMinutes,
              nowMs
            );
            const overdue = left < 0;
            return (
              <Card key={t.id} className={overdue ? 'border-red-500' : ''}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs">
                        {t.orderId.slice(0, 10)}
                      </p>
                      <p className="text-sm font-medium">
                        {t.customerName || 'Walk-in'}
                      </p>
                    </div>
                    <Badge variant={overdue ? 'destructive' : 'secondary'}>
                      {t.sourceType}
                    </Badge>
                  </div>

                  <div className="rounded-md border p-2">
                    <p className="text-xs text-muted-foreground">
                      Selected time
                    </p>
                    <p
                      className={`text-lg font-bold tabular-nums ${overdue ? 'text-red-500' : ''}`}
                    >
                      {formatCountdown(left)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Target: {t.selectedMinutes}m
                    </p>
                  </div>

                  <div className="space-y-1">
                    {t.items.map((it) => (
                      <p key={it.id} className="text-sm">
                        {it.quantity}x {it.productName}
                      </p>
                    ))}
                  </div>

                  <p className="text-xs font-semibold">
                    PKR {fmt(t.orderTotal)}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      disabled={
                        (activeUpdateCount > 0 &&
                          activeUpdatingTicketId !== null &&
                          activeUpdatingTicketId !== t.id) ||
                        (activeUpdatingTicketId !== null &&
                          activeUpdatingTicketId === t.id)
                      }
                      onClick={() => void updateStatus(t.id, 'completed')}
                    >
                      {activeUpdateCount > 0 && activeUpdatingTicketId === t.id
                        ? 'Loading...'
                        : 'Complete'}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={
                        (activeUpdateCount > 0 &&
                          activeUpdatingTicketId !== null &&
                          activeUpdatingTicketId !== t.id) ||
                        (activeUpdatingTicketId !== null &&
                          activeUpdatingTicketId === t.id)
                      }
                      onClick={() => void updateStatus(t.id, 'canceled')}
                    >
                      {activeUpdateCount > 0 && activeUpdatingTicketId === t.id
                        ? 'Loading...'
                        : 'Cancel'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
