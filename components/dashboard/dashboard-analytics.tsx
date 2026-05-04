'use client';

import axios from 'axios';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DASHBOARD_MODULES,
  type DashboardModuleKey,
} from '@/constant/dashboardModules';
import { MODULE_ICONS } from '@/constant/navbarMenu';
import { canAccessDashboardModule } from '@/lib/restaurant-roles';
import { cn } from '@/lib/utils';
import { IconExternalLink } from '@tabler/icons-react';

type AnalyticsCounts = {
  branches: number;
  categories: number;
  menuItems: number;
  orders: number;
  posOrders: number;
  customers: number;
  recommendations: number;
  kdsOpen: number;
  employees: number;
};

type SeriesPoint = { day: string; orders: number; revenue: number };

type AnalyticsPayload = {
  counts: AnalyticsCounts;
  series: SeriesPoint[];
  analyticsTier?: 'basic' | 'advanced';
};

function formatDayLabel(isoDay: string): string {
  const d = new Date(`${isoDay}T12:00:00.000Z`);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

function formatMoney(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

function OrdersBarChart({ series }: { series: SeriesPoint[] }) {
  const max = Math.max(1, ...series.map((p) => p.orders));
  const w = 320;
  const h = 140;
  const pad = { t: 8, r: 8, b: 28, l: 8 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const n = series.length || 1;
  const gap = 4;
  const barW = Math.max(4, (innerW - gap * (n - 1)) / n);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-[180px] text-muted-foreground"
      role="img"
      aria-label="Orders in the last seven days"
    >
      {[0, 0.5, 1].map((t) => {
        const y = pad.t + innerH * t;
        return (
          <line
            key={t}
            x1={pad.l}
            x2={w - pad.r}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeDasharray="4 4"
          />
        );
      })}
      {series.map((p, i) => {
        const hBar = (p.orders / max) * innerH;
        const x = pad.l + i * (barW + gap);
        const y = pad.t + innerH - hBar;
        return (
          <g key={p.day}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(hBar, 2)}
              rx={4}
              fill="var(--chart-1)"
              className="opacity-90"
            />
            <text
              x={x + barW / 2}
              y={h - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {formatDayLabel(p.day)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RevenueAreaChart({ series }: { series: SeriesPoint[] }) {
  const w = 320;
  const h = 140;
  const pad = { t: 12, r: 12, b: 24, l: 12 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...series.map((p) => p.revenue));
  const n = series.length;
  const step = n > 1 ? innerW / (n - 1) : innerW;

  const points = series.map((p, i) => {
    const x = pad.l + i * step;
    const y = pad.t + innerH - (p.revenue / max) * innerH;
    return { x, y, ...p };
  });

  const lineD = points
    .map(
      (pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
    )
    .join(' ');
  const areaD =
    points.length > 0
      ? `${lineD} L ${points[points.length - 1]!.x.toFixed(1)} ${(pad.t + innerH).toFixed(1)} L ${points[0]!.x.toFixed(1)} ${(pad.t + innerH).toFixed(1)} Z`
      : '';

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-[180px] text-muted-foreground"
      role="img"
      aria-label="Revenue in the last seven days"
    >
      {[0, 0.5, 1].map((t) => {
        const y = pad.t + innerH * t;
        return (
          <line
            key={t}
            x1={pad.l}
            x2={w - pad.r}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeDasharray="4 4"
          />
        );
      })}
      {areaD ? (
        <path
          d={areaD}
          fill="var(--chart-2)"
          fillOpacity={0.25}
          stroke="none"
        />
      ) : null}
      {lineD ? (
        <path
          d={lineD}
          fill="none"
          stroke="var(--chart-2)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {points.map((pt) => (
        <circle key={pt.day} cx={pt.x} cy={pt.y} r={3} fill="var(--chart-2)" />
      ))}
      {points.length > 0 ? (
        <>
          <text
            x={points[0]!.x}
            y={h - 4}
            textAnchor="start"
            className="fill-muted-foreground text-[10px]"
          >
            {formatDayLabel(points[0]!.day)}
          </text>
          {points.length > 2 ? (
            <text
              x={points[Math.floor(points.length / 2)]!.x}
              y={h - 4}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {formatDayLabel(points[Math.floor(points.length / 2)]!.day)}
            </text>
          ) : null}
          {points.length > 1 ? (
            <text
              x={points[points.length - 1]!.x}
              y={h - 4}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {formatDayLabel(points[points.length - 1]!.day)}
            </text>
          ) : null}
        </>
      ) : null}
    </svg>
  );
}

function moduleMetric(
  key: DashboardModuleKey,
  data: AnalyticsPayload | null
): { value: string; hint: string } {
  if (!data) return { value: '—', hint: 'Loading…' };
  const c = data.counts;
  const orders7d = data.series.reduce((s, p) => s + p.orders, 0);

  switch (key) {
    case 'dashboard':
      return { value: String(orders7d), hint: 'Orders (7 days)' };
    case 'sales':
      return { value: String(c.orders), hint: 'Total orders' };
    case 'pos':
      return { value: String(c.posOrders), hint: 'POS orders' };
    case 'kds':
      return { value: String(c.kdsOpen), hint: 'Open kitchen tickets' };
    case 'branched':
      return { value: String(c.branches), hint: 'Branches' };
    case 'categories':
      return { value: String(c.categories), hint: 'Menu categories' };
    case 'product':
      return { value: String(c.menuItems), hint: 'Menu items' };
    case 'recommendations':
      return { value: String(c.recommendations), hint: 'Upsell links' };
    case 'records':
      return { value: String(c.customers), hint: 'Customers on file' };
    case 'settings':
      return { value: String(c.employees), hint: 'Team members' };
    default:
      return { value: '—', hint: '' };
  }
}

export default function DashboardAnalytics() {
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [planRecommendations, setPlanRecommendations] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setPermissionsLoaded(false);
    try {
      const [permRes, dashRes] = await Promise.all([
        axios.get<{
          permissions: string[];
          plan?: { recommendations?: boolean };
        }>('/api/me/dashboard-permissions'),
        axios.get<AnalyticsPayload>('/api/restaurant/dashboard-analytics'),
      ]);
      setPermissions(permRes.data.permissions ?? []);
      setPlanRecommendations(permRes.data.plan?.recommendations !== false);
      setAnalytics(dashRes.data);
    } catch {
      setError('Could not load dashboard analytics.');
      setPermissions([]);
      setPlanRecommendations(true);
      setAnalytics(null);
    } finally {
      setPermissionsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get<{ data: { slug?: string } | null }>(
          '/api/restaurant'
        );
        const s = res.data?.data?.slug?.trim();
        if (!cancelled) setSlug(s && s.length > 0 ? s : null);
      } catch {
        if (!cancelled) setSlug(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const modules = useMemo(() => {
    if (!permissionsLoaded || !permissions) return [];
    return DASHBOARD_MODULES.filter((m) => {
      if (m.moduleKey === 'dashboard') return false;
      if (m.moduleKey === 'recommendations' && !planRecommendations) return false;
      return canAccessDashboardModule(permissions, m.moduleKey);
    });
  }, [permissions, permissionsLoaded, planRecommendations]);

  const can = useCallback(
    (key: DashboardModuleKey) =>
      permissions ? canAccessDashboardModule(permissions, key) : false,
    [permissions]
  );

  return (
    <div className="space-y-8 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Live counts for each area of your restaurant. Open a module to work
            there.
          </p>
        </div>
        <div>
          {slug ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a
                  href={`/web-app/${encodeURIComponent(slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open website
                  <IconExternalLink className="ml-2 h-4 w-4" aria-hidden />
                </a>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <a
                  href={`/kiosk/${encodeURIComponent(slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open kiosk
                  <IconExternalLink className="ml-2 h-4 w-4" aria-hidden />
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!permissionsLoaded ? (
        <p className="text-sm text-muted-foreground">Checking module access…</p>
      ) : null}

      {analytics?.analyticsTier === 'basic' ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Advanced analytics</CardTitle>
            <CardDescription>
              Seven-day order and revenue charts, POS mix, open KDS tickets, and
              richer metrics are included on Growth and Scale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" size="sm">
              <Link href="/pricing">Compare plans</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {analytics && analytics.analyticsTier !== 'basic' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders (7 days)</CardTitle>
              <CardDescription>Daily order volume</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <OrdersBarChart series={analytics?.series ?? []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue (7 days)</CardTitle>
              <CardDescription>Daily sum of order totals</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <RevenueAreaChart series={analytics?.series ?? []} />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Totals use order <span className="font-medium">total</span> per
                day (
                {analytics
                  ? formatMoney(
                      analytics.series.reduce((s, p) => s + p.revenue, 0)
                    )
                  : '—'}{' '}
                in window).
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => {
          const Icon = MODULE_ICONS[m.moduleKey];
          const { value, hint } = moduleMetric(m.moduleKey, analytics);
          const allowed = can(m.moduleKey);

          return (
            <Link
              key={m.moduleKey}
              href={m.path}
              className={cn(
                'group rounded-xl outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring',
                !allowed && 'hidden'
              )}
              aria-label={`Open ${m.title}`}
            >
              <Card className="h-full border-border/80 shadow-sm transition-shadow group-hover:shadow-md group-hover:border-primary/30">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-medium">
                      {m.title}
                    </CardTitle>
                    <CardDescription>{hint}</CardDescription>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-2 text-muted-foreground group-hover:text-foreground group-hover:bg-muted/60">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums tracking-tight">
                    {value}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground group-hover:text-primary">
                    Go to module →
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
