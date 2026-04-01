'use client';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { ScrollAreaDemo } from '../scrollarea/scrollarea';
import { SheetContent } from '@/components/ui/sheet';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';

type NavbarSheetProps = {
  /** Called when a nav link is used (e.g. to close the mobile sheet). */
  onNavigate?: () => void;
};

export function NavbarSheet({ onNavigate }: NavbarSheetProps) {
  const pathname = usePathname();

  return (
    <SheetContent side="left" className="flex flex-col">
        {/* Navigation container */}
        <nav className="grid gap-2 text-lg font-medium">
          {/* Link for the top section with an icon */}
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <TriangleAlert className="h-6 w-6" />
          </Link>

          {/* Map through NAVBAR_ITEMS to create navigation links */}
          {NAVBAR_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => onNavigate?.()}
              className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 ${
                pathname === item.path
                  ? 'bg-primary/10 text-foreground' // Apply active styles if current path matches item path
                  : 'text-muted-foreground hover:text-foreground bg-primary/10' // Apply default styles otherwise
              } transition-all hover:text-primary hover:bg-primary/20`}
            >
              {/* Render the icon and title for each navigation item */}
              {item.icon}
              {item.title}
            </Link>
          ))}

          {/* Include ScrollAreaDemo component */}
          <ScrollAreaDemo />
        </nav>

        <div className="mt-auto p-2">
          <UserMenu className="w-full justify-start" />
        </div>
    </SheetContent>
  );
}
