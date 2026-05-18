'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader, Loader2, Loader2Icon, Menu, PanelLeft, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/darkmode/darkmode';
import Navbar from '@/components/dashboard/navbar';
import { NavbarSheet } from '@/components/dashboard/NavbarSheet';
import UserMenu from '@/components/dashboard/UserMenu';
import Bread from '@/components/dashboard/breadcrumb';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import axios from 'axios';
import eventBus from '@/lib/even';
import { cn } from '@/lib/utils';
import { DASHBOARD_MODULES } from '@/constant/dashboardModules';

const SIDEBAR_STORAGE_KEY = 'dashboard-sidebar-open';

interface RootLayoutProps {
  children: React.ReactNode;
}

const DEFAULT_DOCUMENT_TITLE = 'Foodluk';

function moduleKeyForPath(pathname: string): string | null {
  const exact = DASHBOARD_MODULES.find((m) => m.path === pathname);
  if (exact) return exact.moduleKey;
  const nested = DASHBOARD_MODULES.find((m) =>
    pathname.startsWith(`${m.path}/`)
  );
  return nested?.moduleKey ?? null;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();
  const [restaurantName, setRestaurantName] = useState<string>('Restaurant');
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState<string | null>(
    null
  );
  const [logoFailed, setLogoFailed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [subscriptionAllowed, setSubscriptionAllowed] = useState(true);
  const [subscriptionWarning, setSubscriptionWarning] = useState<string | null>(
    null
  );
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [allowedModuleKeys, setAllowedModuleKeys] = useState<Set<string>>(
    () => new Set(DASHBOARD_MODULES.map((m) => m.moduleKey))
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setSidebarOpen(stored === 'true');
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
    } catch {
      /* ignore */
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      const callback = encodeURIComponent(pathname ?? '/dashboard');
      router.replace(`/login?callbackUrl=${callback}`);
    }
  }, [sessionStatus, pathname, router]);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await axios.get('/api/me/subscription-access');
        const data = res?.data?.data;
        if (!mounted) return;
        const allowed = Boolean(data?.allowed);
        setSubscriptionAllowed(allowed);
        setSubscriptionWarning(
          typeof data?.warning === 'string' && data.warning.trim() !== ''
            ? data.warning
            : null
        );
        setSubscriptionChecked(true);
        if (!allowed) {
          toast.error(
            'Your trial/plan is expired or not configured. Please choose a pricing plan.'
          );
          router.replace('/pricing');
        }
      } catch {
        if (!mounted) return;
        setSubscriptionAllowed(false);
        setSubscriptionChecked(true);
        toast.error('Could not verify subscription access.');
        router.replace('/pricing');
      }
    };
    void check();
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    let mounted = true;
    axios
      .get<{
        permissions?: string[];
        plan?: { recommendations?: boolean };
      }>('/api/me/dashboard-permissions')
      .then((res) => {
        if (!mounted) return;
        const list = res.data.permissions ?? [];
        const allowed = new Set<string>();
        for (const token of list) {
          const [moduleKey, action] = token.split(':');
          if (action === 'access' && moduleKey) {
            allowed.add(moduleKey);
          }
        }
        if (res.data.plan?.recommendations === false) {
          allowed.delete('recommendations');
        }
        setAllowedModuleKeys(allowed);
      })
      .catch(() => {
        if (!mounted) return;
        // Do not lock users out if permission API has transient errors.
        setAllowedModuleKeys(
          new Set(DASHBOARD_MODULES.map((m) => m.moduleKey))
        );
      })
      .finally(() => {
        if (!mounted) return;
        setPermissionsChecked(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!permissionsChecked) return;
    if (pathname === '/no-access') return;
    const moduleKey = moduleKeyForPath(pathname ?? '/');
    if (!moduleKey) return;
    if (!allowedModuleKeys.has(moduleKey)) {
      router.replace('/no-access');
    }
  }, [allowedModuleKeys, pathname, permissionsChecked, router]);

  const toggleNav = () => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px)').matches
    ) {
      setSidebarOpen((o) => !o);
    } else {
      setMobileNavOpen((o) => !o);
    }
  };

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        if (!navigator.onLine) {
          toast.error('You are offline.');
          return;
        }

        const response = await axios.get('/api/restaurant');
        const name = response?.data?.data?.name as string | undefined;
        const slug = response?.data?.data?.slug as string | undefined;
        const logoUrl = response?.data?.data?.logoUrl as string | undefined;
        setRestaurantName(name ?? 'Restaurant');
        setRestaurantSlug(slug?.trim() ? slug.trim() : null);
        setRestaurantLogoUrl(logoUrl ?? null);
        setLogoFailed(false);
      } catch (error: any) {
        setRestaurantName('Restaurant');
        setRestaurantSlug(null);
        setRestaurantLogoUrl(null);
        toast.error(error.response?.data?.error || error.message);
      }
    };

    fetchRestaurant();

    const handler = () => fetchRestaurant();
    eventBus.on('fetchStoreData', handler);

    return () => {
      eventBus.removeListener('fetchStoreData', handler);
    };
  }, []);

  useEffect(() => {
    document.title = restaurantName;

    const link =
      (document.querySelector('link[rel="icon"]') as HTMLLinkElement | null) ??
      (() => {
        const el = document.createElement('link');
        el.rel = 'icon';
        document.head.appendChild(el);
        return el;
      })();

    if (restaurantLogoUrl && !logoFailed) {
      link.href = restaurantLogoUrl;
    } else {
      link.href = '/favicon.ico';
    }
  }, [restaurantName, restaurantLogoUrl, logoFailed]);

  useEffect(() => {
    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
      const link = document.querySelector(
        'link[rel="icon"]'
      ) as HTMLLinkElement | null;
      if (link) link.href = '/favicon.ico';
    };
  }, []);

  if (sessionStatus === 'loading' || sessionStatus === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-300 text-sm text-muted-foreground dark:bg-black">
        <Loader2Icon className="animate-spin text-primary h-10 w-10 mx-auto" />
      </div>
    );
  }

  if (!subscriptionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-300 text-sm text-muted-foreground dark:bg-black">
        <Loader2Icon className="animate-spin text-primary h-10 w-10 mx-auto" />
      </div>
    );
  }

  if (!subscriptionAllowed) {
    return null;
  }

  if (!permissionsChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-300 text-sm text-muted-foreground dark:bg-black">
        <Loader2Icon className="animate-spin text-primary h-10 w-10 mx-auto" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-300 dark:bg-black">
        <div
          className={cn(
            'grid min-h-screen w-full',
            sidebarOpen
              ? 'md:grid-cols-[minmax(0,220px)_1fr] lg:grid-cols-[minmax(0,280px)_1fr]'
              : 'grid-cols-1'
          )}
        >
          {/* Sidebar */}
          <div
            className={cn(
              'hidden border-r bg-muted/40 md:flex md:flex-col',
              !sidebarOpen && 'md:hidden'
            )}
          >
            <div className="flex h-full flex-col gap-2">
              <div className="flex h-14 items-center border-b px-4">
                <Link
                  href={restaurantSlug ? `/web-app/${restaurantSlug}` : '/'}
                  target={restaurantSlug ? '_blank' : undefined}
                  className="flex items-center gap-2 font-semibold"
                >
                  <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xs font-semibold uppercase">
                    {restaurantLogoUrl && !logoFailed ? (
                      <img
                        src={restaurantLogoUrl}
                        alt={restaurantName}
                        className="h-full w-full object-cover"
                        onError={() => setLogoFailed(true)}
                      />
                    ) : (
                      <span>{restaurantName.charAt(0)}</span>
                    )}
                  </div>
                  <span className="truncate">{restaurantName}</span>
                </Link>
              </div>
              <Navbar />
              <div className="mt-auto px-2 pb-4">
                <UserMenu className="w-full justify-start" />
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-2 border-b bg-muted/40 px-4 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Toggle navigation"
                title="Show or hide the sidebar with navigation links"
                onClick={toggleNav}
              >
                <span className="hidden md:inline-flex" aria-hidden>
                  {sidebarOpen ? (
                    <PanelLeftClose className="h-5 w-5" />
                  ) : (
                    <PanelLeft className="h-5 w-5" />
                  )}
                </span>
                <span className="inline-flex md:hidden" aria-hidden>
                  <Menu className="h-5 w-5" />
                </span>
              </Button>

              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <NavbarSheet onNavigate={() => setMobileNavOpen(false)} />
              </Sheet>

              <div
                className={cn(
                  'flex min-w-0 shrink items-center gap-2',
                  sidebarOpen && 'md:hidden'
                )}
              >
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-semibold uppercase ring-1 ring-border">
                  {restaurantLogoUrl && !logoFailed ? (
                    <img
                      src={restaurantLogoUrl}
                      alt={restaurantName}
                      className="h-full w-full object-cover"
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    <span>{restaurantName.charAt(0)}</span>
                  )}
                </div>
                <span className="truncate text-sm font-semibold">
                  {restaurantName}
                </span>
              </div>

              <Bread />
              <ModeToggle />
              <div
                className={cn(
                  'ml-auto flex items-center gap-2',
                  sidebarOpen && 'md:hidden'
                )}
              >
                <UserMenu />
              </div>
            </header>

            <main className="flex flex-1 flex-col gap-4 p-4">
              {subscriptionWarning && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                  {subscriptionWarning}
                </div>
              )}
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default RootLayout;
