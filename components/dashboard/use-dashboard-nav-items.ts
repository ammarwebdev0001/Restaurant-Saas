'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { navItemsForPermissions } from '@/lib/dashboard-nav';
import type { NavItem } from '@/types/Navbar';

export function useDashboardNavItems(): NavItem[] {
  // Render nothing until permissions are loaded to avoid a visible "all modules"
  // flicker on initial dashboard load.
  const [items, setItems] = useState<NavItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get<{ permissions?: string[] }>('/api/me/dashboard-permissions')
      .then((res) => {
        if (cancelled) return;
        const perms = res.data.permissions ?? [];
        setItems(navItemsForPermissions(perms));
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback: show all modules if permissions endpoint fails.
        setItems(NAVBAR_ITEMS);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return items;
}
