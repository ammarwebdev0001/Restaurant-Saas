'use client';

import { ChevronDown, MapPin, UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

type StorefrontHeroProps = {
  restaurantName: string;
  logoUrl?: string | null;
  hasBanner?: boolean;
  branchCount?: number;
  menuItemCount?: number;
};

export function StorefrontHero({
  restaurantName,
  logoUrl,
  hasBanner = false,
  branchCount = 0,
  menuItemCount = 0,
}: StorefrontHeroProps) {
  const { t } = useTranslation();
  const initial = restaurantName.charAt(0).toUpperCase();
  const onDark = hasBanner;

  const titleClass = onDark ? 'text-white' : 'text-[#0f172a]';
  const mutedClass = onDark ? 'text-white/85' : 'text-[#64748b]';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-8 sm:p-10 lg:p-12 ${
        onDark
          ? 'border-white/20 bg-white/10 text-white backdrop-blur-xl'
          : 'border-[var(--restaurant-glass-border,#e2e8f0)] bg-[var(--restaurant-glass,rgba(255,255,255,0.82))] backdrop-blur-xl'
      }`}
      style={
        onDark
          ? undefined
          : {
              boxShadow:
                '0 28px 70px -28px color-mix(in srgb, var(--restaurant-primary, #0f172a) 32%, transparent)',
            }
      }
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, var(--restaurant-glow, #fcd34d), transparent 70%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, var(--restaurant-primary, #ea580c), transparent 72%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-4 w-full">
            <span
              className={`inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold shadow-lg ring-2 ${
                onDark
                  ? 'bg-white/20 ring-white/30 text-white'
                  : 'bg-primary/10 text-primary ring-primary/25'
              }`}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                initial
              )}
            </span>
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                  onDark ? 'text-white/70' : 'text-primary'
                }`}
              >
                {t('storefrontWelcome')}
              </p>
              <h1
                className={`text-3xl font-bold sm:text-4xl lg:text-5xl `}
              >
                {restaurantName}
              </h1>
            </div>
          </div>

          <p className={`text-base leading-relaxed sm:text-lg ${mutedClass}`}>
            {t('storefrontTagline')}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-8 shadow-lg">
              <a href="#orderMethod">{t('storefrontOrderNow')}</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={`rounded-full px-8 ${
                onDark
                  ? 'border-white/40 bg-white/10 text-white hover:bg-white/20'
                  : 'border-[#e2e8f0] bg-white/80'
              }`}
            >
              <a href="#locations">{t('storefrontBrowseLocations')}</a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:min-w-[240px]">
          <StatCard
            icon={<UtensilsCrossed className="h-5 w-5" />}
            label={t('storefrontMenuItems')}
            value={menuItemCount > 0 ? String(menuItemCount) : '—'}
            onDark={onDark}
          />
          <StatCard
            icon={<MapPin className="h-5 w-5" />}
            label={t('storefrontLocations')}
            value={branchCount > 0 ? String(branchCount) : '—'}
            onDark={onDark}
          />
        </div>
      </div>

      <a
        href="#order"
        className={`mt-8 flex items-center justify-center gap-1 text-xs font-medium uppercase tracking-widest transition hover:opacity-80 ${mutedClass}`}
      >
        <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden />
        {t('storefrontScrollToOrder')}
      </a>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  onDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onDark: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        onDark
          ? 'border-white/15 bg-white/10'
          : 'border-[var(--restaurant-glass-border,#e2e8f0)] bg-white/70'
      }`}
    >
      <span
        className={`mb-2 inline-flex rounded-lg p-2 ${
          onDark ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'
        }`}
      >
        {icon}
      </span>
      <p
        className={`text-2xl font-bold tabular-nums ${onDark ? 'text-white' : 'text-[#0f172a]'}`}
      >
        {value}
      </p>
      <p className={`mt-0.5 text-xs ${onDark ? 'text-white/75' : 'text-[#64748b]'}`}>
        {label}
      </p>
    </div>
  );
}
