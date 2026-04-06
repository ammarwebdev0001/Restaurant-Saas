export type OrderInfo = {
  mode: 'delivery' | 'pickUp';
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  address?: string;
  apartment?: string;
  gateCode?: string;
  addressName?: string;
  /** Path-based storefront (`/web-app/{slug}`); loads menu via `/api/customer/menu?slug=` */
  restaurantSlug?: string;
};
