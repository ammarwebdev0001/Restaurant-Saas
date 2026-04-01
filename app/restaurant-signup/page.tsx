import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RestaurantSignupPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-xl border bg-muted/20 p-8">
        <h1 className="text-3xl font-bold">Restaurant Signup</h1>
        <p className="mt-3 text-muted-foreground">
          Create your owner account, complete onboarding, then launch your branded
          restaurant experience.
        </p>

        <div className="mt-8 space-y-4 text-sm">
          <p>- Step 1: Create account and select OWNER role</p>
          <p>- Step 2: Add restaurant name, domain, logo, and banners</p>
          <p>- Step 3: Add branches and start accepting orders</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/register">Continue to Signup</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

