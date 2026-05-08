import type { MetadataRoute } from 'next';

function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  return 'http://localhost:3000';
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const routes = [
    '/',
    '/pricing',
    '/documentation',
    '/demo-request',
    '/restaurant-signup',
    '/order-path/click-and-collect',
    '/order-path/curbside-pickup',
    '/order-path/customer-facing-delivery',
    '/order-path/table-orders',
    '/order-path/mobile-ordering-application',
    '/privacy-policy',
    '/refund-policy',
    '/policies',
    '/subscription-returns',
    '/sitemap',
    '/login',
    '/register',
    '/reset-password',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }));
}
