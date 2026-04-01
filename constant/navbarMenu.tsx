import {
  Home,
  Package,
  ShoppingCart,
  Archive,
  Settings,
  FolderTree,
  Sparkles,
} from 'lucide-react';
import { NavItem } from '@/types/Navbar';

export const NAVBAR_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: 'Orders',
    path: '/orders',
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {
    title: 'Categories',
    path: '/categories',
    icon: <FolderTree className="h-4 w-4" />,
  },
  {
    title: 'Products',
    path: '/product',
    icon: <Package className="h-4 w-4" />,
  },
  {
    title: 'Recommendations',
    path: '/recommendations',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    title: 'Records',
    path: '/records',
    icon: <Archive className="h-4 w-4" />,
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <Settings className="h-4 w-4" />,
  },
];
