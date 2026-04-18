'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type RestaurantBrandingDto = {
  id: string;
  logoUrl: string | null;
  mainBannerUrl: string | null;
  menuBannerUrls: string[];
};

export function RestaurantBrandingCard() {
  const [loading, setLoading] = useState(true);
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [mainBannerUrl, setMainBannerUrl] = useState('');
  const [menuBannerLines, setMenuBannerLines] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get<{ data: RestaurantBrandingDto | null }>(
          '/api/restaurant'
        );
        const d = res.data?.data;
        if (cancelled) return;
        if (!d) {
          setHasRestaurant(false);
          setLogoUrl('');
          setMainBannerUrl('');
          setMenuBannerLines('');
          return;
        }
        setHasRestaurant(true);
        setLogoUrl(d.logoUrl ?? '');
        setMainBannerUrl(d.mainBannerUrl ?? '');
        setMenuBannerLines((d.menuBannerUrls ?? []).join('\n'));
      } catch {
        if (!cancelled) toast.error('Could not load restaurant branding.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!navigator.onLine) {
      toast.error('You are offline. Please check your internet connection.');
      return;
    }

    const menuBannerUrls = menuBannerLines
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const res = await axios.patch<{ data: RestaurantBrandingDto }>(
        '/api/restaurant',
        {
          logoUrl,
          mainBannerUrl,
          menuBannerUrls,
        }
      );
      const d = res.data?.data;
      if (d) {
        setLogoUrl(d.logoUrl ?? '');
        setMainBannerUrl(d.mainBannerUrl ?? '');
        setMenuBannerLines((d.menuBannerUrls ?? []).join('\n'));
      }
      toast.success('Branding saved.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: unknown } } };
      const flat = err.response?.data?.error;
      if (flat && typeof flat === 'object' && 'fieldErrors' in flat) {
        const fe = (flat as { fieldErrors?: Record<string, string[]> })
          .fieldErrors;
        const msg = fe
          ? Object.values(fe)
              .flat()
              .filter(Boolean)
              .join(' ')
          : '';
        toast.error(msg || 'Validation failed.');
      } else {
        toast.error('Failed to save branding.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logo & banners</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!hasRestaurant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logo & banners</CardTitle>
          <CardDescription>
            No restaurant is linked to your account yet, so branding cannot be
            edited here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo & banners</CardTitle>
        <CardDescription>
          URLs used on the customer website and kiosk. Leave a field empty to
          clear it. Use full <code className="text-xs">https://</code> links.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="restaurant-logo-url">Logo URL</Label>
          <Input
            id="restaurant-logo-url"
            type="url"
            placeholder="https://…"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="restaurant-main-banner-url">Main banner URL</Label>
          <Input
            id="restaurant-main-banner-url"
            type="url"
            placeholder="https://…"
            value={mainBannerUrl}
            onChange={(e) => setMainBannerUrl(e.target.value)}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Shown as the large background on the web ordering page.
          </p>
        </div>
        {/* <div className="space-y-2">
          <Label htmlFor="restaurant-menu-banners">Menu carousel images</Label>
          <textarea
            id="restaurant-menu-banners"
            className={cn(
              'flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            placeholder={'https://example.com/banner-1.jpg\nhttps://example.com/banner-2.jpg'}
            value={menuBannerLines}
            onChange={(e) => setMenuBannerLines(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            One image URL per line (optional). Used in the customer sidebar
            carousel.
          </p>
        </div> */}
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button type="button" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Saving…' : 'Save branding'}
        </Button>
      </CardFooter>
    </Card>
  );
}
