import Link from 'next/link';
import { Button } from '@/components/ui/button';

type PaymentPageProps = {
  searchParams?: Promise<{
    plan?: string;
    price?: string;
  }>;
};

function parsePrice(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const plan = typeof params?.plan === 'string' ? params.plan : 'STARTER';
  const price = parsePrice(params?.price);

  return (
    <main className="min-h-screen bg-muted/20 px-6 py-16">
      <div className="mx-auto max-w-xl rounded-xl border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete your subscription payment to continue.
        </p>

        <div className="mt-6 space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Selected plan</span>
            <span className="font-medium">{plan}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="text-lg font-semibold">PKR {price.toLocaleString('en-PK')}</span>
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Payment gateway integration can be added here (Stripe/JazzCash/Easypaisa/etc.).
        </p>

        <div className="mt-6 flex gap-2">
          <Button asChild>
            <Link href="/pricing">Back to Pricing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/restaurant-signup">Continue Signup</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
