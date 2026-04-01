import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEMO_SUBDOMAIN = process.env.NEXT_PUBLIC_DEMO_SUBDOMAIN || "restaurant";

export function GET(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const [hostname, port] = host.split(":");

  let targetHost = hostname;

  // Local: localhost:3000 -> royalspoon.localhost:3000
  if (hostname === "localhost") {
    targetHost = `${DEMO_SUBDOMAIN}.localhost`;
  } else {
    // Production-ish:
    // - if root domain is configured, enforce demo subdomain on it.
    // - otherwise, replace existing subdomain with demo subdomain.
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

    if (rootDomain && hostname.endsWith(rootDomain)) {
      targetHost = `${DEMO_SUBDOMAIN}.${rootDomain}`;
    } else {
      const parts = hostname.split(".");
      if (parts.length >= 2) {
        targetHost = `${DEMO_SUBDOMAIN}.${parts.slice(-2).join(".")}`;
      }
    }
  }

  const protocol = req.nextUrl.protocol || "http:";
  const withPort = port ? `${targetHost}:${port}` : targetHost;
  const target = `${protocol}//${withPort}/`;

  return NextResponse.redirect(target, 307);
}

