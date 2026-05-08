import { redirect } from 'next/navigation';
import { SubscriptionPlan } from '@prisma/client';

import { PaymentCheckoutClient } from '@/components/saas/payment-checkout-client';
import { getAppSession } from '@/lib/auth/app-session';
import { db } from '@/lib/db';
import { getPayPalConfigError, isPayPalConfigured } from '@/lib/paypal-server';

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

  return (
    <PaymentCheckoutClient
      plan={plan}
      planName={catalog.name}
      priceLabel={catalog.priceLabel}
      description={catalog.description}
      features={catalog.features ?? []}
      stripeReady={isPayPalConfigured()}
      stripeConfigError={getPayPalConfigError()}
      signedIn={Boolean(userEmail)}
      userEmail={userEmail}
    />
  );
}
