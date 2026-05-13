import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/** Same fallback as `authOptions.secret` in `lib/auth-options.ts` (dev only). */
function resolveNextAuthJwtSecret(): string | undefined {
  const fromEnv = process.env.NEXTAUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== "production") return "dev-nextauth-secret";
  return undefined;
}

/** Staff-facing terminals: require a signed-in session (JWT) at the edge. */
function isStaffTerminalPath(pathname: string): boolean {
  const roots = [
    "/kds",
    "/kds-screen",
    "/pos",
    "/order-display",
  ] as const;
  return roots.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

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

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  if (isStaffTerminalPath(pathname)) {
    const secret = resolveNextAuthJwtSecret();
    if (!secret) {
      console.error(
        "[middleware] NEXTAUTH_SECRET is missing in production; cannot verify staff routes."
      );
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", `${pathname}${url.search}`);
      return NextResponse.redirect(login);
    }
    const token = await getToken({ req, secret });
    if (!token) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", `${pathname}${url.search}`);
      return NextResponse.redirect(login);
    }
  }

  const hostname = (req.headers.get("host") || "").split(":")[0];
  const subdomain = getSubdomainFromHost(hostname);

  // No subdomain => marketing/auth/dashboard; short `/order` URLs map to web-app routes.
  // Do not match `/orders` — that path is reserved for the dashboard (see /sales list).
  if (!subdomain) {
    // Match only `/order` and `/order/...` (not `/order-path`).
    const isWebAppOrderPath =
      (pathname === "/order" || pathname.startsWith("/order/")) &&
      !pathname.startsWith("/orders");
    if (isWebAppOrderPath) {
      url.pathname = `/web-app${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Keep API untouched so handlers can read host/subdomain directly.
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Already under storefront app — no second rewrite.
  if (pathname.startsWith("/web-app")) return NextResponse.next();

  // Subdomain traffic serves the same Next routes as /web-app/*.
  url.pathname = `/web-app${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"],
};
