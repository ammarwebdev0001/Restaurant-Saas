'use client';

import { useEffect, useState } from 'react';

type RestaurantPayload = {
  name?: string | null;
  logoUrl?: string | null;
};

export function OperationalHeaderRestaurantBrand() {
  const [name, setName] = useState<string>('Restaurant');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/restaurant');
        const json = (await res.json().catch(() => ({}))) as {
          data?: RestaurantPayload | null;
        };
        if (cancelled) return;
        const d = json?.data;
        if (d?.name?.trim()) setName(d.name.trim());
        const logo = d?.logoUrl?.trim();
        setLogoUrl(logo && logo.length > 0 ? logo : null);
        setLogoFailed(false);
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const initial = (name || 'R').charAt(0).toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {logoUrl && !logoFailed ? (
        // eslint-disable-next-line @next/next/no-img-element -- dashboard URLs from restaurant settings
        <img
          src={logoUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-md border border-border object-cover"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-sm font-semibold text-muted-foreground"
          aria-hidden
        >
          {initial}
        </span>
      )}
      <h1 className="truncate text-lg font-semibold tracking-tight">{name}</h1>
    </div>
  );
}
