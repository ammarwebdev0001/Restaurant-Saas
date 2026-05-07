export type SalesOrderRow =
  | {
      id: string;
      kind: 'menu_order';
      trackingToken?: string | null;
      ticketNumber?: number | null;
      sourceType: string;
      total: number;
      status: string;
      paymentStatus?: string | null;
      transactionId?: string | null;
      createdAt: string;
    }
  | {
      id: string;
      kind: 'sale_transaction';
      trackingToken?: string | null;
      ticketNumber?: number | null;
      sourceType: string;
      total: number | null;
      status: string;
      transactionId?: string | null;
      createdAt: string;
    };

export type SalesOrdersStats = {
  online: { count: number; totalAmount: number };
  pos: { count: number; totalAmount: number };
  kiosk: { count: number; totalAmount: number };
  all: { count: number; totalAmount: number };
};

export type SalesOrdersApiResponse = {
  onlineOrders: SalesOrderRow[];
  posOrders: SalesOrderRow[];
  kioskOrders: SalesOrderRow[];
  stats: SalesOrdersStats;
  /** @deprecated Combined list for legacy clients */
  orders?: SalesOrderRow[];
};
