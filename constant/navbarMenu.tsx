import {
  Home,
  Package,
  ShoppingCart,
  ScanLine,
  Monitor,
  Store,
  Archive,
  Settings,
  FolderTree,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { DASHBOARD_MODULES } from '@/constant/dashboardModules';
import { NavItem } from '@/types/Navbar';

export const MODULE_ICONS: Record<
  (typeof DASHBOARD_MODULES)[number]['moduleKey'],
  LucideIcon
> = {
  dashboard: Home,
  sales: ShoppingCart,
  pos: ScanLine,
  kds: Monitor,
  branched: Store,
  categories: FolderTree,
  product: Package,
  recommendations: Sparkles,
  records: Archive,
  settings: Settings,
};

export const NAVBAR_ITEMS: NavItem[] = DASHBOARD_MODULES.map((m) => {
  const Icon = MODULE_ICONS[m.moduleKey];
  return {
    title: m.title,
    path: m.path,
    moduleKey: m.moduleKey,
    icon: <Icon className="h-4 w-4" />,
  };
});
