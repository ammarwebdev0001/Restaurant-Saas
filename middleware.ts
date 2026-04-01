import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getSubdomainFromHost(hostname: string) {
  // Local dev: royalspoon.localhost
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "");
    if (sub && sub !== "www") return sub;
    return null;
  }

  // Production: royalspoon.domain.com (set NEXT_PUBLIC_ROOT_DOMAIN=domain.com)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (rootDomain && hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.slice(0, -(`.${rootDomain}`.length));
    if (sub && sub !== "www") return sub;
  }

  return null;
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;
  const hostname = (req.headers.get("host") || "").split(":")[0];
  const subdomain = getSubdomainFromHost(hostname);

  // No subdomain => marketing/auth/dashboard, but order URLs live under /customer-app
  if (!subdomain) {
    if (pathname.startsWith("/order")) {
      url.pathname = `/customer-app${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Keep API untouched so handlers can read host/subdomain directly.
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Avoid rewriting already-prefixed customer paths.
  if (pathname.startsWith("/customer-app")) return NextResponse.next();

  // Subdomain traffic serves the customer app.
  url.pathname = `/customer-app${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"],
};

