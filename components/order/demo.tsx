'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import FullscreenButton from '@/components/fullscreen/fullscreen';
import { SalesOrdersTabs } from '@/components/sales/sales-orders-tabs';
import { useRef } from 'react';
import { Button } from '../ui/button';
import { PlusIcon } from 'lucide-react';

export function Orders() {
  const tableRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={tableRef} className="w-full  h-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Orders</h2>
          <p className="text-sm text-muted-foreground">
            Online, POS, and kiosk orders, totals, and per-order details.
          </p>
        </div>
      </div>
      <Card className="h-full w-full flex flex-col">
        <div className="relative">
          <CardHeader>
            <CardTitle>Sales</CardTitle>

            <FullscreenButton targetRef={tableRef} />
          </CardHeader>
        </div>
        <CardContent className="z-0 flex flex-col gap-6 overflow-auto">
          <SalesOrdersTabs />
        </CardContent>
      </Card>
    </div>
  );
}
