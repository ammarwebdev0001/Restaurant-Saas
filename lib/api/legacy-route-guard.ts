import { NextResponse } from 'next/server';

/** Legacy inventory routes — disabled; use authenticated `/api/restaurant/*` APIs. */
export function legacyApiDisabled() {
  return NextResponse.json(
    {
      error:
        'This API is disabled. Sign in to the dashboard and use the restaurant menu APIs.',
    },
    { status: 410 }
  );
}
