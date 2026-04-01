'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ADMIN_NAV_ITEMS } from '@/constant/adminNav';
import { cn } from '@/lib/utils';

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1 px-2 text-sm font-medium">
      {ADMIN_NAV_ITEMS.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
            pathname === item.path
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
