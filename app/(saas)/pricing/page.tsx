import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { getAppSession } from '@/lib/auth/app-session';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

export default async function PricingPage() {
  const session = await getAppSession();
  const isLoggedIn = Boolean(session?.user?.email);

  let currentPlanSlug: string | null = null;
  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (user) {
      const restaurant = await getRestaurantForUser(user.id);
      if (restaurant) {
        const sub = await db.restaurantSubscription.findUnique({
          where: { restaurantId: restaurant.id },
          select: { plan: true },
        });
        if (sub?.plan) {
          currentPlanSlug = sub.plan;
        }
      }
    }
  }

  let plans: Array<{
    plan: string;
    name: string;
    price: number;
    priceLabel: string;
    description: string;
    features: string[];
  }> = [];
  try {
    const rows = await db.$queryRaw<
      Array<{
        plan: string;
        name: string;
        price: number;
        priceLabel: string;
        description: string;
        features: string[] | null;
      }>
    >(Prisma.sql`
      SELECT "plan"::text AS "plan", "name", "price", "priceLabel", "description", "features"
      FROM "SubscriptionCatalog"
      ORDER BY CASE "plan"
        WHEN 'STARTER' THEN 1
        WHEN 'GROWTH' THEN 2
        WHEN 'SCALE' THEN 3
        ELSE 99
      END
    `);
    if (rows.length > 0) {
      plans = rows.map((r) => ({
        plan: r.plan,
        name: r.name,
        price: Number(r.price) || 0,
        priceLabel: r.priceLabel,
        description: r.description,
        features: r.features ?? [],
      }));
    }
  } catch {
    plans = [];
  }

  return (
    <main className="min-h-screen bg-muted/20 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold">Simple pricing for every stage</h1>
          <p className="mt-3 text-muted-foreground">
            Start lean, then scale your restaurant operations without switching
            tools.
          </p>
          <div className="mt-5">
            <Button variant="outline" asChild>
              <Link href="/demo-request">Request demo (get trial period)</Link>
            </Button>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
            No pricing plans configured yet. Ask admin to seed or update plans.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan =
                currentPlanSlug !== null &&
                plan.plan.toUpperCase() === currentPlanSlug.toUpperCase();

              return (
              <article
                key={plan.plan}
                className="rounded-xl border bg-background p-6 shadow-sm"
              >
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-2 text-3xl font-bold">{plan.priceLabel}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f}>- {f}</li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <p className="mt-6 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-center text-sm font-medium text-foreground">
                    Your current plan
                  </p>
                ) : (
                  <>
                    <Button className="mt-6 w-full" asChild>
                      <Link
                        href={
                          isLoggedIn
                            ? `/payment?plan=${encodeURIComponent(plan.plan)}`
                            : `/login?callbackUrl=${encodeURIComponent(
                                `/payment?plan=${encodeURIComponent(plan.plan)}`
                              )}`
                        }
                      >
                        Choose {plan.name}
                      </Link>
                    </Button>
                    <Button className="mt-2 w-full" variant="outline" asChild>
                      <Link href="/demo-request">Request demo for trial</Link>
                    </Button>
                  </>
                )}
              </article>
            );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
