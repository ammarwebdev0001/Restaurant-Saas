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
    <main className="relative min-h-screen overflow-hidden bg-[#120803] px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-x-0 -top-48 h-96 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.5),transparent_70%)]" />
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-fire-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-black/45 p-8 shadow-[0_40px_100px_-30px] shadow-fire-900/80 backdrop-blur-xl md:p-12">
        <div className="mb-12 text-center">
          <span className="inline-flex items-center rounded-full border border-fire-400/40 bg-fire-500/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.18em] text-fire-300">
            Pricing table
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
            Simple pricing for every stage
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-300">
            Start lean, then scale your restaurant operations without switching
            tools.
          </p>
          <div className="mt-5">
            <Button
              variant="outline"
              asChild
              className="border-white/25 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href="/demo-request">Request demo (get trial period)</Link>
            </Button>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-sm text-zinc-300">
            No pricing plans configured yet. Ask admin to seed or update plans.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan =
                currentPlanSlug !== null &&
                plan.plan.toUpperCase() === currentPlanSlug.toUpperCase();
              const isFeatured = plan.plan.toUpperCase() === 'GROWTH';

              return (
              <article
                key={plan.plan}
                className={`relative flex flex-col rounded-2xl border p-6 transition-transform duration-300 ${
                  isFeatured
                    ? 'border-fire-400/60 bg-gradient-to-b from-fire-500/20 to-white/5 shadow-[0_25px_80px_-25px] shadow-fire-500/80 md:-translate-y-2'
                    : 'border-white/15 bg-white/5'
                }`}
              >
                {isFeatured ? (
                  <span className="mb-4 inline-flex w-fit rounded-full border border-fire-300/40 bg-fire-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-fire-200">
                    Popular
                  </span>
                ) : null}
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-3 text-4xl font-bold tracking-tight">{plan.priceLabel}</p>
                <p className="mt-2 min-h-10 text-sm text-zinc-300">
                  {plan.description}
                </p>
                <div className="mt-5 text-sm font-medium text-zinc-200">What&apos;s included:</div>
                <ul className="mt-3 flex-1 space-y-2 text-sm text-zinc-300">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-fire-400">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <p className="mt-6 rounded-lg border border-fire-300/40 bg-fire-500/15 px-4 py-3 text-center text-sm font-medium text-fire-100">
                    Your current plan
                  </p>
                ) : (
                  <>
                    <Button
                      className={`mt-6 w-full ${
                        isFeatured
                          ? 'bg-gradient-to-r from-fire-500 to-fire-600 text-white hover:from-fire-400 hover:to-fire-500'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      asChild
                    >
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
                    <Button
                      className="mt-2 w-full border-white/20 bg-transparent text-zinc-100 hover:bg-white/10"
                      variant="outline"
                      asChild
                    >
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
