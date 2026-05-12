import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Public PayPal SDK configuration for the inline Buttons component.
 * Returns the client ID, currency and sandbox mode flag so the browser
 * can load the JS SDK with the correct settings.
 */
export function GET() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim() ?? '';
  const currency = (process.env.PAYPAL_CURRENCY ?? 'EUR').toUpperCase();
  const mode =
    (process.env.PAYPAL_MODE ?? 'sandbox').trim().toLowerCase() === 'live'
      ? 'live'
      : 'sandbox';

  if (!clientId) {
    return NextResponse.json(
      { error: 'PayPal is not configured (missing PAYPAL_CLIENT_ID).' },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { clientId, currency, mode },
    { headers: { 'Cache-Control': 'private, max-age=300' } }
  );
}
