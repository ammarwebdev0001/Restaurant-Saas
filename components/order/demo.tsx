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

export function Orders() {
  const tableRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={tableRef} className="w-full h-full">
      <Card className="h-full w-full flex flex-col">
        <div className="relative">
          <CardHeader>
            <CardTitle>Sales</CardTitle>
            <CardDescription>
              Online, POS, and kiosk orders, totals, and per-order details.
            </CardDescription>
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
