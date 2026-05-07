'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Linkedin, Twitter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  const orderPath = [
    { label: t('marketing.footer.orderPathItems.clickAndCollect'), href: '/documentation' },
    { label: t('marketing.footer.orderPathItems.curbside'), href: '/documentation' },
    { label: t('marketing.footer.orderPathItems.delivery'), href: '/documentation' },
    { label: t('marketing.footer.orderPathItems.tableOrders'), href: '/documentation' },
    { label: t('marketing.footer.orderPathItems.mobileOrdering'), href: '/documentation' },
  ];

  const operations = [
    { label: t('marketing.footer.operationsItems.aggregator'), href: '/documentation' },
    { label: t('marketing.footer.operationsItems.reviews'), href: '/documentation' },
    { label: t('marketing.footer.operationsItems.callCenter'), href: '/documentation' },
  ];

  const legal = [
    { label: t('marketing.footer.legalItems.esg'), href: '/policies' },
    { label: t('marketing.footer.legalItems.legalInfo'), href: '/privacy' },
    { label: t('marketing.footer.legalItems.subscriptionReturns'), href: '/subscription-returns' },
  ];

  return (
    <footer className="relative border-t border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-900 dark:bg-black dark:text-zinc-300">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-fire-500/15 ring-1 ring-fire-500/40">
                <Image
                  src="/Logo.png"
                  alt="Foodluk"
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0 object-contain"
                />
              </span>
              <span className="text-lg font-semibold">Foodluk</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-zinc-600 dark:text-zinc-400">
              {t('marketing.footer.tagline')}
            </p>
          </div>

          {/* Order path */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
              {t('marketing.footer.orderPath')}
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              {orderPath.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-fire-500 dark:hover:text-fire-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Operational management */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
              {t('marketing.footer.operations')}
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              {operations.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-fire-500 dark:hover:text-fire-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
              {t('marketing.footer.legal')}
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              {legal.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-fire-500 dark:hover:text-fire-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 sm:flex-row sm:items-center">
          <p>{t('marketing.footer.rights', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-3">
            <Link
              href="#"
              aria-label="Twitter"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition-colors hover:border-fire-500/40 hover:text-fire-500 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-fire-400"
            >
              <Twitter className="h-4 w-4" />
            </Link>
            <Link
              href="#"
              aria-label="LinkedIn"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition-colors hover:border-fire-500/40 hover:text-fire-500 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-fire-400"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
