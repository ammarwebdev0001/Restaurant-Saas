import { redirect } from 'next/navigation';
import { SubscriptionPlan } from '@prisma/client';

import { PaymentCheckoutClient } from '@/components/saas/payment-checkout-client';
import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getPayPalConfigError, isPayPalConfigured } from '@/lib/paypal-server';
import { getRestaurantForUser } from '@/lib/restaurant-owner';

type PaymentPageProps = {
  searchParams?: Promise<{ plan?: string }>;
};

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const planRaw =
    typeof params?.plan === 'string' ? params.plan.toUpperCase().trim() : 'STARTER';

  const planValues = Object.values(SubscriptionPlan) as string[];
  const plan = planValues.includes(planRaw) ? (planRaw as SubscriptionPlan) : null;
  if (!plan) redirect('/pricing');

  const catalog = await db.subscriptionCatalog.findUnique({
    where: { plan },
  });
  if (!catalog) redirect('/pricing');

  const session = await getAppSession();
  const userEmail =
    typeof session?.user?.email === 'string' && session.user.email.trim() !== ''
      ? session.user.email.trim()
      : null;

  let restaurantId: string | null = null;
  let priceMajor: number | null = null;
  if (userEmail) {
    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    if (user) {
      const restaurant = await getRestaurantForUser(user.id);
      if (restaurant) restaurantId = restaurant.id;
    }
  }
  if (Number.isFinite(catalog.price) && catalog.price > 0) {
    priceMajor = Number(catalog.price);
  }

  return (
    <PaymentCheckoutClient
      plan={plan}
      planName={catalog.name}
      priceLabel={catalog.priceLabel}
      priceMajor={priceMajor}
      description={catalog.description}
      features={catalog.features ?? []}
      stripeReady={isPayPalConfigured()}
      stripeConfigError={getPayPalConfigError()}
      signedIn={Boolean(userEmail)}
      userEmail={userEmail}
      restaurantId={restaurantId}
    />
  );
}
