'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';
import { ThemeToggle } from './theme-toggle';

export default function Header() {
  const { t } = useTranslation();

  const navLinks = [
    { href: '/demo-request', label: t('marketing.nav.demoRequest') },
    { href: '/restaurant-signup', label: t('marketing.nav.restaurantSignup') },
    { href: '/pricing', label: t('marketing.nav.pricing') },
    { href: '/documentation', label: t('marketing.nav.documentation') },
  ];

  return (
    <header className="sticky top-4 z-40 w-full px-3 sm:px-4">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/85 px-3 shadow-[0_10px_40px_-10px] shadow-black/10 backdrop-blur-md dark:border-zinc-800/80 dark:bg-black/80 dark:shadow-black/60 sm:px-4">
        {/* Logo tile */}
        <Link
          href="/"
          aria-label="FoodLuk home"
          className="flex h-12 shrink-0 items-center justify-center"
        >
          <Image
            src="/Logo.png"
            alt="Foodluk"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            priority
          />
          <span className="ml-2 text-base font-semibold text-zinc-900 dark:text-white sm:text-lg">
            FoodLuk
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium text-zinc-700 dark:text-white md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-fire-500 dark:hover:text-fire-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button
            asChild
            className="h-10 shrink-0 rounded-lg bg-gradient-to-br from-fire-400 via-fire-500 to-fire-600 px-6 text-sm font-semibold text-white shadow-[0_10px_28px_-8px] shadow-fire-500/60 transition-all hover:from-fire-500 hover:to-fire-700 hover:shadow-fire-500/80"
          >
            <Link href="/register">{t('marketing.nav.getStarted')}</Link>
          </Button>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />

          <details className="group">
            <summary
              aria-label={t('marketing.nav.openMenu') as string}
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 transition-colors hover:border-fire-500 hover:text-fire-500 dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-white dark:hover:border-fire-400 dark:hover:text-fire-400 [&::-webkit-details-marker]:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </summary>

            <div className="absolute left-3 right-3 top-[calc(100%+0.75rem)] overflow-hidden rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-[0_18px_50px_-20px] shadow-black/30 backdrop-blur-md dark:border-zinc-800 dark:bg-black/95 dark:shadow-black">
              <nav className="flex flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-white">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-3 transition-colors hover:bg-zinc-100 hover:text-fire-500 dark:hover:bg-zinc-900 dark:hover:text-fire-400"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <Button
                asChild
                className="mt-3 h-11 w-full rounded-lg bg-gradient-to-br from-fire-400 via-fire-500 to-fire-600 text-sm font-semibold text-white shadow-[0_10px_28px_-8px] shadow-fire-500/60 transition-all hover:from-fire-500 hover:to-fire-700 hover:shadow-fire-500/80"
              >
                <Link href="/register">{t('marketing.nav.getStarted')}</Link>
              </Button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
