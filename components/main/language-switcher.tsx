'use client';

import * as React from 'react';
import { Check, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { setUiLanguage } from '@/lib/i18n/client';
import type { UiLanguage } from '@/lib/i18n/resources';
import { cn } from '@/lib/utils';

const LANGUAGES: { code: UiLanguage; nativeLabel: string; short: string }[] = [
  { code: 'en', nativeLabel: 'English', short: 'EN' },
  { code: 'es', nativeLabel: 'Español', short: 'ES' },
];

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const currentCode: UiLanguage = mounted && i18n.resolvedLanguage === 'en' ? 'en' : 'es';
  const current = LANGUAGES.find((l) => l.code === currentCode) ?? LANGUAGES[1];

  const apply = (lang: UiLanguage) => {
    setUiLanguage(lang);
    void i18n.changeLanguage(lang);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6"
    >
      {open && (
        <div className="w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white/95 p-1.5 shadow-[0_18px_50px_-20px] shadow-black/30 backdrop-blur-md dark:border-zinc-800 dark:bg-black/95 dark:shadow-black">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t('marketing.languageSwitcher.label')}
          </p>
          {LANGUAGES.map((lang) => {
            const active = lang.code === currentCode;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => apply(lang.code)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  active
                    ? 'bg-fire-500/10 text-fire-500 dark:text-fire-400'
                    : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900',
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-7 items-center justify-center rounded bg-zinc-100 text-[10px] font-bold tracking-wider text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {lang.short}
                  </span>
                  <span className="font-medium">{lang.nativeLabel}</span>
                </span>
                {active ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('marketing.languageSwitcher.label') as string}
        className="group flex h-12 items-center gap-2 rounded-full border border-zinc-200 bg-white pl-2 pr-4 text-sm font-semibold text-zinc-900 shadow-[0_14px_40px_-12px] shadow-black/30 transition-all hover:border-fire-500 hover:text-fire-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:shadow-black/60 dark:hover:border-fire-400 dark:hover:text-fire-400"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-fire-500/15 text-fire-500 transition-colors group-hover:bg-fire-500/20">
          <Globe className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider">
          {current.short}
        </span>
      </button>
    </div>
  );
}
