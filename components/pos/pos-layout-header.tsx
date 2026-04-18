'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import { ModeToggle } from '@/components/darkmode/darkmode';
import UserMenu from '@/components/dashboard/UserMenu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OperationalHeaderRestaurantBrand } from '@/components/layout/operational-header-restaurant-brand';
import { usePosCartGuard } from '@/components/pos/pos-cart-guard-context';

export function PosLayoutHeader() {
  const router = useRouter();
  const { posCartHasItems } = usePosCartGuard();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const requestDashboard = () => {
    if (posCartHasItems) {
      setLeaveOpen(true);
      return;
    }
    router.push('/dashboard');
  };

  const confirmLeaveToDashboard = () => {
    setLeaveOpen(false);
    router.push('/dashboard');
  };

  return (
    <header
      className="flex h-14 shrink-0 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/60"
      aria-label="Point of sale"
    >
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard POS cart?</AlertDialogTitle>
            <AlertDialogDescription>
              You have items in the cart that are not saved yet. Going to the dashboard will clear this sale from the
              screen. Save the order first if you need to keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Stay on POS</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmLeaveToDashboard}>
              Leave and lose cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <OperationalHeaderRestaurantBrand />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 text-muted-foreground sm:inline-flex"
          title="Back to dashboard"
          onClick={requestDashboard}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Dashboard"
          onClick={requestDashboard}
        >
          <LayoutDashboard className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
