import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { DEMO_RESTAURANT_SLUG } from "@/lib/demo-restaurant";

/** Marketing CTA: open storefront for the seeded demo tenant (path-based slug, no subdomain redirect). */
export function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = `/web-app/${DEMO_RESTAURANT_SLUG}`;
  url.search = "";
  return NextResponse.redirect(url, 307);
}
