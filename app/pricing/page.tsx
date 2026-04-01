import Link from 'next/link';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Starter',
    price: '$29/mo',
    description: 'Perfect for one small location getting online.',
    features: ['1 Branch', 'Menu management', 'Order dashboard', 'Basic analytics'],
  },
  {
    name: 'Growth',
    price: '$79/mo',
    description: 'For growing restaurants and multiple teams.',
    features: [
      'Up to 5 branches',
      'Role-based users',
      'Advanced analytics',
      'Branding and banners',
    ],
  },
  {
    name: 'Scale',
    price: 'Custom',
    description: 'Enterprise setup for multi-brand operations.',
    features: [
      'Unlimited branches',
      'Priority support',
      'Custom integrations',
      'Dedicated onboarding',
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-muted/20 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold">Simple pricing for every stage</h1>
          <p className="mt-3 text-muted-foreground">
            Start lean, then scale your restaurant operations without switching tools.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-xl border bg-background p-6 shadow-sm">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold">{plan.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f}>- {f}</li>
                ))}
              </ul>
              <Button className="mt-6 w-full" asChild>
                <Link href="/restaurant-signup">Choose {plan.name}</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

