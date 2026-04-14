'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';

type PendingOrder = {
  id: string;
  status: string;
  total: number;
  sourceType: string;
  createdAt: string;
  customer: { name: string } | null;
  items: { id: string; quantity: number; menuItem: { name: string } }[];
};

function fmt(v: number) {
  return v.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MIN_CUSTOM_MINUTES = 1;
const MAX_CUSTOM_MINUTES = 240;

export function KdsManagerBoard() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  /** Resolved prep minutes per order (from presets or custom input). */
  const [prepMinutes, setPrepMinutes] = useState<Record<string, number>>({});
  /** Raw text for the optional custom minutes field per order. */
  const [customMinutesText, setCustomMinutesText] = useState<Record<string, string>>(
    {}
  );
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/restaurant/kds/manager-orders', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to load');
      const json = (await res.json()) as { data?: PendingOrder[] };
      setOrders(json.data ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resolveMinutesForOrder(orderId: string): number | null {
    const raw = customMinutesText[orderId]?.trim();
    if (raw) {
      const n = Math.round(Number(raw));
      if (Number.isFinite(n) && n >= MIN_CUSTOM_MINUTES && n <= MAX_CUSTOM_MINUTES) {
        return n;
      }
      return null;
    }
    const fallback = prepMinutes[orderId] ?? 10;
    if (
      fallback >= MIN_CUSTOM_MINUTES &&
      fallback <= MAX_CUSTOM_MINUTES
    ) {
      return fallback;
    }
    return null;
  }

  async function proceed(orderId: string) {
    const minutes = resolveMinutesForOrder(orderId);
    if (minutes === null) {
      toast.warn(
        `Enter a valid prep time (${MIN_CUSTOM_MINUTES}–${MAX_CUSTOM_MINUTES} minutes), or use a preset.`
      );
      return;
    }
    setSubmitting(orderId);
    try {
      const res = await fetch('/api/restaurant/kds/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          selectedMinutes: minutes,
        }),
      });
      if (!res.ok) throw new Error('Failed to proceed');
      await load();
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">KDS Manager</h1>
          <p className="text-sm text-muted-foreground">
            Choose a preset or enter custom minutes, then proceed the order to making.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="default">
            <Link href="/kds-screen">Open KDS Screen</Link>
          </Button>
          <Button variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading pending orders...</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No pending orders.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="font-mono">{o.id.slice(0, 10)}</span>
                  <Badge variant="secondary">{o.sourceType}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">{o.customer?.name || 'Walk-in'}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString()}
                </p>
                <div className="space-y-1">
                  {o.items.map((it) => (
                    <p key={it.id} className="text-xs">
                      {it.quantity}x {it.menuItem.name}
                    </p>
                  ))}
                </div>
                <p className="text-xs font-semibold">PKR {fmt(o.total)}</p>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Select time:</p>
                  <div className="flex flex-wrap gap-2">
                    {[10, 15, 30].map((m) => (
                      <Button
                        key={m}
                        size="sm"
                        type="button"
                        variant={(prepMinutes[o.id] ?? 10) === m ? 'default' : 'outline'}
                        onClick={() => {
                          setPrepMinutes((prev) => ({ ...prev, [o.id]: m }));
                          setCustomMinutesText((prev) => {
                            const next = { ...prev };
                            delete next[o.id];
                            return next;
                          });
                        }}
                      >
                        {m}m
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor={`kds-custom-min-${o.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Custom (minutes)
                    </label>
                    <Input
                      id={`kds-custom-min-${o.id}`}
                      className="h-9"
                      inputMode="numeric"
                      placeholder={`${MIN_CUSTOM_MINUTES}–${MAX_CUSTOM_MINUTES}`}
                      value={customMinutesText[o.id] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomMinutesText((prev) => ({
                          ...prev,
                          [o.id]: v,
                        }));
                        const n = Math.round(Number(v));
                        if (
                          v.trim() !== '' &&
                          Number.isFinite(n) &&
                          n >= MIN_CUSTOM_MINUTES &&
                          n <= MAX_CUSTOM_MINUTES
                        ) {
                          setPrepMinutes((prev) => ({ ...prev, [o.id]: n }));
                        }
                      }}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  type="button"
                  disabled={submitting === o.id}
                  onClick={() => void proceed(o.id)}
                >
                  {submitting === o.id ? 'Proceeding...' : 'Proceed'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
