'use client';

import { ClipboardList, MapPinned, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { GlassPanel, SectionHeading } from '@/components/customer-app/storefront/glass-panel';

const STEP_ICONS = [MapPinned, ClipboardList, ShoppingBag] as const;

export function StorefrontSteps() {
  const { t } = useTranslation();

  const steps = [
    {
      title: t('storefrontStep1Title'),
      body: t('storefrontStep1Body'),
    },
    {
      title: t('storefrontStep2Title'),
      body: t('storefrontStep2Body'),
    },
    {
      title: t('storefrontStep3Title'),
      body: t('storefrontStep3Body'),
    },
  ];

  return (
    <GlassPanel>
      <SectionHeading
        title={t('storefrontHowItWorks')}
        subtitle={t('storefrontHowItWorksSubtitle')}
      />
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? ShoppingBag;
          return (
            <li
              key={step.title}
              className="relative rounded-2xl border border-[var(--restaurant-glass-border,#e2e8f0)] bg-white/80 p-5"
            >
              <span
                className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="mb-3 mt-2 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="font-semibold text-[#0f172a]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                {step.body}
              </p>
            </li>
          );
        })}
      </ol>
    </GlassPanel>
  );
}
