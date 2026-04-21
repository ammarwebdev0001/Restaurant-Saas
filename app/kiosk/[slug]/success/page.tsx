import type { Metadata } from 'next';
import Link from 'next/link';

import { KioskSuccessCartCleaner } from '@/components/kiosk/kiosk-success-cart-cleaner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import '../../kiosk-light.css';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orderRef?: string; session_id?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Kiosk payment successful · ${slug}`,
    description: 'Kiosk Stripe payment success',
  };
}

export default async function KioskSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const orderRef =
    typeof sp.orderRef === 'string' && sp.orderRef.trim() ? sp.orderRef.trim() : null;
  const hasSessionId =
    typeof sp.session_id === 'string' && sp.session_id.trim().length > 0;

  return (
    <div className="kiosk-light-root min-h-screen bg-[#f8fafc] px-4 py-12 text-[#0f172a]">
      <KioskSuccessCartCleaner slug={slug} hasSessionId={hasSessionId} />
      <div className="mx-auto max-w-lg">
        <Card className="border border-[#e2e8f0] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-[#0f172a]">Payment successful</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-[#64748b]">
              Your kiosk payment is confirmed and your order has been sent to the kitchen.
            </p>
            {orderRef ? (
              <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <p>
                  <strong>Reference:</strong> {orderRef}
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 w-full">
              <Button asChild className="bg-[#ea580c] text-white hover:bg-[#c2410c] w-full">
                <Link href={`/kiosk/${encodeURIComponent(slug)}`}>Start new order</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

