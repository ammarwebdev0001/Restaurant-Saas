import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  getPayPalConfigError,
  isPayPalConfigured,
} from '@/lib/paypal-server';
import { applyPayPalPostCapture } from '@/lib/paypal-post-capture';

export const runtime = 'nodejs';

const bodySchema = z.object({
  id: z.string().min(3).max(200),
});

/**
 * Captures a PayPal order created by the inline JS-SDK Buttons flow and
 * propagates the result to local order / subscription records.
 */
export async function POST(req: NextRequest) {
  if (!isPayPalConfigured()) {
    return NextResponse.json(
      { error: getPayPalConfigError() ?? 'PayPal is not configured' },
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  try {
    const result = await applyPayPalPostCapture({
      orderToken: parsed.data.id,
      baseUrl,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error('PayPal capture-order failed:', e);
    return NextResponse.json(
      { error: 'Could not capture PayPal payment' },
      { status: 502 }
    );
  }
}
