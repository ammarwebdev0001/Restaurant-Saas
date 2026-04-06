/**
 * Client-only helpers for resolving which restaurant’s menu to load.
 */

export function inferHostSubdomainForMenu(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (rootDomain) {
    const suffix = `.${rootDomain}`;
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length);
      return sub && sub !== 'www' ? sub : null;
    }
  }

  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    return sub && sub !== 'www' ? sub : null;
  }

  const parts = hostname.split('.');
  return parts.length >= 3 ? parts[0] : null;
}

/** Prefer slug (path-based storefront); else subdomain from host or legacy storeId. */
export function buildCustomerMenuRequestUrl(
  restaurantSlug: string | null | undefined,
  storeId: string | null | undefined,
  hostSubdomain: string | null
): string | null {
  const slug = restaurantSlug?.trim();
  if (slug) {
    return `/api/customer/menu?slug=${encodeURIComponent(slug)}`;
  }
  const sub = (hostSubdomain?.trim() || storeId?.trim() || '') || null;
  if (!sub) return null;
  return `/api/customer/menu?subdomain=${encodeURIComponent(sub)}`;
}
