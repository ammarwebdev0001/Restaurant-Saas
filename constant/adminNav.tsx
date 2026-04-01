import type { ReactNode } from 'react';
import { Building2, CreditCard, LayoutDashboard, Settings } from 'lucide-react';

export type AdminNavItem = {
  title: string;
  path: string;
  icon: ReactNode;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    title: 'Dashboard',
    path: '/admin/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: 'Restaurants',
    path: '/admin/restaurants',
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    title: 'Subscriptions',
    path: '/admin/subscriptions',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    title: 'Platform settings',
    path: '/admin/settings',
    icon: <Settings className="h-4 w-4" />,
  },
];
