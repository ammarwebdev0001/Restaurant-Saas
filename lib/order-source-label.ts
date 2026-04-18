export type OrderSourceTypeKey = 'POS' | 'ONLINE' | 'WALK_IN' | 'KIOSK' | 'OTHER';

const LABELS: Record<OrderSourceTypeKey, string> = {
  POS: 'POS',
  ONLINE: 'Online',
  WALK_IN: 'Walk-in',
  KIOSK: 'Kiosk',
  OTHER: 'Other',
};

export function orderSourceLabel(sourceType: string): string {
  if (sourceType in LABELS) {
    return LABELS[sourceType as OrderSourceTypeKey];
  }
  return sourceType;
}
