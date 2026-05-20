'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-toastify';
import { IconCopy, IconExternalLink } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function CustomerEntryLinks() {
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicBase, setPublicBase] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get<{ data: { slug?: string } | null }>(
          '/api/restaurant'
        );
        const s = res.data?.data?.slug?.trim();
        if (!cancelled) setSlug(s && s.length > 0 ? s : null);
      } catch {
        if (!cancelled) setSlug(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPublicBase(
      typeof window !== 'undefined' ? window.location.origin : ''
    );
  }, []);

  const webAppPath = slug ? `/web-app/${encodeURIComponent(slug)}` : '';
  const kioskPath = slug ? `/kiosk/${encodeURIComponent(slug)}` : '';

  const webAppUrl =
    publicBase && webAppPath ? `${publicBase}${webAppPath}` : webAppPath;
  const kioskUrl =
    publicBase && kioskPath ? `${publicBase}${kioskPath}` : kioskPath;

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Website & kiosk</CardTitle>
          <CardDescription>Loading your store links…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!slug) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Website & kiosk</CardTitle>
          <CardDescription>
            No restaurant is linked to your account yet, so customer URLs are
            unavailable.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild className="gap-2">
          <Link href={webAppPath} target="_blank" rel="noopener noreferrer">
            Open website
            <IconExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="secondary" className="gap-2">
          <Link href={kioskPath} target="_blank" rel="noopener noreferrer">
            Open kiosk
            <IconExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public URLs</CardTitle>
          <CardDescription>
            Share or configure these absolute links (your current domain +
            path). Use them as redirect targets, kiosk bookmarks, or QR codes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Customer website
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="block flex-1 break-all rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {webAppUrl}
              </code>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-1"
                onClick={() => void copyText('Website URL', webAppUrl)}
              >
                <IconCopy className="h-4 w-4" aria-hidden />
                Copy
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Kiosk UI</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="block flex-1 break-all rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {kioskUrl}
              </code>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-1"
                onClick={() => void copyText('Kiosk URL', kioskUrl)}
              >
                <IconCopy className="h-4 w-4" aria-hidden />
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
