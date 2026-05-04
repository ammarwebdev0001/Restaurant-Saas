import Link from 'next/link';

import { SaasStaticPage } from '@/components/marketing/saas-static-page';

export const metadata = {
  title: 'Subscription returns & exchanges | Foodluk',
  description:
    'How plan changes, cancellations, and billing questions work for Foodluk SaaS subscriptions.',
};

export default function SubscriptionReturnsPage() {
  return (
    <SaasStaticPage
      title="Subscription returns & exchanges"
      subtitle="Guidance for Foodluk SaaS subscriptions (Starter, Growth, Scale). Exact terms may also appear in your order confirmation, invoice, or separate agreement."
    >
      <h2 id="plans">Plan changes (upgrade / downgrade)</h2>
      <p>
        When you move to a higher tier, new limits and features typically apply from the
        start of the new billing period or immediately if your checkout flow specifies
        instant activation. Downgrades may take effect at the next renewal so you can
        finish the current paid period at the higher tier.
      </p>

      <h2 id="cancellation">Cancellation</h2>
      <p>
        You may cancel future renewals according to the controls available in your billing
        experience (e.g. customer portal or support). Cancellation stops future charges; it
        does not erase historical invoices. Access to paid features may end when the
        current period ends unless otherwise stated.
      </p>

      <h2 id="refunds">Refunds & “returns”</h2>
      <p>
        SaaS subscriptions are generally not “returned” like physical goods. Refunds, if
        any, are handled case-by-case where required by law or where we explicitly offer a
        money-back window in writing. Trials and promotional credits are not cash refunds
        unless stated.
      </p>

      <h2 id="billing">Billing disputes</h2>
      <p>
        If you believe a charge is incorrect, contact us promptly with the invoice or
        payment reference. We will investigate in good faith and correct clear billing
        errors where applicable.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        For subscription changes, billing receipts, or enterprise terms, reach out via{' '}
        <Link href="/demo-request" className="text-primary underline">
          demo request
        </Link>{' '}
        or your named account contact. You can review current public plans on{' '}
        <Link href="/pricing" className="text-primary underline">
          Pricing
        </Link>
        .
      </p>
      <p className="text-xs text-muted-foreground">
        This page is informational. It does not replace a signed contract or statutory
        consumer rights in your country.
      </p>
    </SaasStaticPage>
  );
}
