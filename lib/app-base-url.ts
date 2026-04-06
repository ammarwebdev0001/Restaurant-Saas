/** Absolute origin for links in emails (no trailing slash). */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'http://localhost:3000';
}
