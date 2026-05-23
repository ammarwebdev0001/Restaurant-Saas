'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconMapPin, IconPhone } from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';

import { GlassPanel, SectionHeading } from '@/components/customer-app/storefront/glass-panel';

type Branch = {
  id: string;
  name: string;
  address: string;
  phone?: string;
};

export function StorefrontLocations({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/customer/branches?slug=${encodeURIComponent(slug)}`
        );
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json?.data) ? json.data : [];
        if (!cancelled) {
          setBranches(
            rows.map((b: Record<string, unknown>) => ({
              id: String(b.id),
              name: String(b.name || 'Branch'),
              address: String(b.address || ''),
              phone: b.phone ? String(b.phone) : undefined,
            }))
          );
        }
      } catch {
        if (!cancelled) setBranches([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!loading && branches.length === 0) return null;

  return (
    <GlassPanel>
      <SectionHeading
        title={t('storefrontLocationsTitle')}
        subtitle={t('storefrontLocationsSubtitle')}
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {branches.map((branch) => (
            <li
              key={branch.id}
              className="flex gap-3 rounded-2xl border border-[var(--restaurant-glass-border,#e2e8f0)] bg-white/85 p-4 transition hover:border-primary/30"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <IconMapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[#0f172a]">{branch.name}</p>
                {branch.address ? (
                  <p className="mt-1 text-sm text-[#64748b]">{branch.address}</p>
                ) : null}
                {branch.phone ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#64748b]">
                    <IconPhone className="h-3.5 w-3.5" />
                    {branch.phone}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-center">
        <a
          href="#order"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('storefrontOrderFromLocation')}
        </a>
      </p>
    </GlassPanel>
  );
}
