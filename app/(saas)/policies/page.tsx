import Link from 'next/link';

import { SaasStaticPage } from '@/components/marketing/saas-static-page';

export const metadata = {
  title: 'Policies | Foodluk',
  description: 'Platform policies for Foodluk SaaS customers.',
};

export default function PoliciesPage() {
  return (
    <SaasStaticPage
      title="Platform policies"
      subtitle="These policies apply to your use of the Foodluk SaaS product and related websites operated by Foodluk for marketing, billing, and support—not to policies you set for your own restaurant guests."
    >
      <h2 id="acceptable-use">Acceptable use</h2>
      <p>
        You agree not to misuse the service: no unlawful activity, no attempting to break
        security or access others’ data, no distribution of malware, and no use that
        overloads or disrupts the platform. We may suspend or terminate access for
        violations.
      </p>

      <h2 id="accounts">Accounts and access</h2>
      <p>
        You are responsible for credentials, invited users, and role assignments under your
        account. Notify us promptly of unauthorized use. Features available to you may
        depend on your subscription tier and configuration.
      </p>

      <h2 id="content">Your content</h2>
      <p>
        You retain rights to content you upload (menus, images, branding). You grant us the
        license needed to host, process, and display that content to provide the service to
        you and your authorized users.
      </p>

      <h2 id="availability">Service changes</h2>
      <p>
        We may modify features, retire legacy flows, or schedule maintenance. We aim to
        minimize disruption and will communicate material changes when reasonable.
      </p>

      <h2 id="legal">Related documents</h2>
      <ul>
        <li>
          <Link href="/privacy" className="text-primary underline">
            Privacy Policy
          </Link>
        </li>
        <li>
          <Link href="/subscription-returns" className="text-primary underline">
            Subscription returns &amp; exchanges
          </Link>
        </li>
        <li>
          <Link href="/pricing" className="text-primary underline">
            Pricing &amp; plans
          </Link>
        </li>
      </ul>
    </SaasStaticPage>
  );
}
