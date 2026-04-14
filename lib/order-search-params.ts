import type { OrderInfo } from '@/components/order/order-types';

function pick(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string {
  const v = sp[key];
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

/** Server: build `OrderInfo` from URL query (supports `restaurantSlug` or `slug`). */
export function orderInfoFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
  mode: 'delivery' | 'pickUp'
): OrderInfo {
  const slug =
    pick(sp, 'restaurantSlug').trim() || pick(sp, 'slug').trim() || undefined;
  return {
    mode,
    restaurantName: pick(sp, 'restaurantName') || pick(sp, 'storeName'),
    storeId: pick(sp, 'storeId'),
    storeName: pick(sp, 'storeName'),
    storeAddress: pick(sp, 'storeAddress'),
    address: pick(sp, 'address'),
    apartment: pick(sp, 'apartment'),
    gateCode: pick(sp, 'gateCode'),
    addressName: pick(sp, 'addressName'),
    ...(slug ? { restaurantSlug: slug } : {}),
  };
}

function orderInfoToQueryString(info: OrderInfo | undefined): string {
  if (!info) return '';
  const p = new URLSearchParams();
  const add = (k: string, v: string | undefined) => {
    if (v != null && v !== '') p.set(k, v);
  };
  add('restaurantName', info.restaurantName);
  add('storeId', info.storeId);
  add('storeName', info.storeName);
  add('storeAddress', info.storeAddress);
  add('address', info.address);
  add('apartment', info.apartment);
  add('gateCode', info.gateCode);
  add('addressName', info.addressName);
  add('restaurantSlug', info.restaurantSlug);
  return p.toString();
}

/** Client navigation: preserve order context (including slug) across order → cart → checkout. */
export function orderPathWithQuery(
  pathname: string,
  orderInfo: OrderInfo | undefined
): string {
  const q = orderInfoToQueryString(orderInfo);
  return q ? `${pathname}?${q}` : pathname;
}
