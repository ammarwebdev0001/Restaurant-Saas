'use client';

import { Clock, ShieldCheck, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AcceptedPaymentMethods } from '@/components/payments/accepted-payment-methods';

const PERK_ICONS = [Truck, Clock, ShieldCheck] as const;

export function StorefrontPerks({ onDark = false }: { onDark?: boolean }) {
  const { t } = useTranslation();

  const perks = [
    { title: t('storefrontPerk1Title'), body: t('storefrontPerk1Body') },
    { title: t('storefrontPerk2Title'), body: t('storefrontPerk2Body') },
    { title: t('storefrontPerk3Title'), body: t('storefrontPerk3Body') },
  ];

  return (
    <div
      className={`rounded-3xl border p-6 sm:p-8 ${
        onDark
          ? 'border-white/20 bg-white/10 backdrop-blur-xl'
          : 'border-[var(--restaurant-glass-border,#e2e8f0)] bg-[var(--restaurant-glass,rgba(255,255,255,0.78))] backdrop-blur-xl'
      }`}
      style={{
        boxShadow:
          '0 20px 50px -20px color-mix(in srgb, var(--restaurant-primary, #0f172a) 22%, transparent)',
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,auto] lg:items-center">
        <div className="grid gap-4 sm:grid-cols-3">
          {perks.map((perk, i) => {
            const Icon = PERK_ICONS[i] ?? ShieldCheck;
            return (
              <div key={perk.title} className="flex gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p
                    className={`text-sm font-semibold ${onDark ? 'text-white' : 'text-[#0f172a]'}`}
                  >
                    {perk.title}
                  </p>
                  <p
                    className={`mt-0.5 text-xs leading-relaxed ${onDark ? 'text-white/75' : 'text-[#64748b]'}`}
                  >
                    {perk.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div
          className={`rounded-2xl border p-4 ${
            onDark ? 'border-white/15 bg-white/5' : 'border-[#e2e8f0] bg-white/60'
          }`}
        >
          <p
            className={`mb-3 text-xs font-semibold uppercase tracking-wide ${onDark ? 'text-white/70' : 'text-[#64748b]'}`}
          >
            {t('storefrontSecurePay')}
          </p>
          <AcceptedPaymentMethods
            variant={onDark ? 'on-dark' : 'default'}
            size="sm"
            showPayPal
          />
        </div>
      </div>
    </div>
  );
}
