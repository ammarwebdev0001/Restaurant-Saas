/**
 * End-customer / storefront role — browse menu and place orders (customer app).
 * Permission tokens use the same moduleKey:action pattern as the restaurant dashboard.
 */
export const CUSTOMER_USER_MODULES = [
  { moduleKey: 'customer_menu', title: 'Browse menu & items' },
  { moduleKey: 'customer_order', title: 'Orders & checkout' },
] as const;

export type CustomerUserModuleKey =
  (typeof CUSTOMER_USER_MODULES)[number]['moduleKey'];
