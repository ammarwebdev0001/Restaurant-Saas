export type SalesOrderStatusBucket = 'completed' | 'pending' | 'canceled';

/** Normalize menu order / POS transaction status for sales reporting. */
export function salesOrderStatusBucket(status: string): SalesOrderStatusBucket {
  const s = status.trim().toLowerCase();
  if (s === 'completed' || s === 'complete') return 'completed';
  if (
    s === 'canceled' ||
    s === 'cancelled' ||
    s === 'failed' ||
    s === 'cancel'
  ) {
    return 'canceled';
  }
  return 'pending';
}

export function isCompletedSalesStatus(status: string): boolean {
  return salesOrderStatusBucket(status) === 'completed';
}

export function rowTotalAmount(total: number | null | undefined): number {
  if (total == null || Number.isNaN(total)) return 0;
  return total;
}
