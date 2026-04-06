'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { navItemsForPermissions } from '@/lib/dashboard-nav';
import type { NavItem } from '@/types/Navbar';

export function useDashboardNavItems(): NavItem[] {
  const [items, setItems] = useState<NavItem[]>(NAVBAR_ITEMS);

  useEffect(() => {
    axios
      .get<{ permissions?: string[] }>('/api/me/dashboard-permissions')
      .then((res) => {
        const perms = res.data.permissions ?? [];
        setItems(navItemsForPermissions(perms));
      })
      .catch(() => {
        setItems(NAVBAR_ITEMS);
      });
  }, []);

  return items;
}
