import Link from 'next/link';

import { SaasStaticPage } from '@/components/marketing/saas-static-page';

export const metadata = {
  title: 'Privacy Policy | Foodluk',
  description: 'How Foodluk handles personal data for SaaS customers and platform users.',
};

export default function PrivacyPage() {
  return (
    <SaasStaticPage
      title="Privacy Policy"
      subtitle="This policy describes how Foodluk (“we”, “us”) handles information in connection with the Foodluk SaaS platform. It applies to restaurant operators and their staff who use our services—not to your end-customers’ relationship with your business, which you govern separately."
    >
      <p>
        We collect account and usage data needed to run the service: for example, name,
        email, authentication identifiers, restaurant configuration, order and menu data
        you store in the product, and technical logs (IP, device type, timestamps) for
        security and reliability.
      </p>
      <p>
        We use this data to provide, secure, and improve the platform; authenticate users;
        process subscriptions and billing where applicable; and communicate service-related
        notices. We do not sell your personal information.
      </p>
      <p>
        We may use subprocessors (e.g. hosting, email, payment) who process data on our
        instructions. Where required by law, we support access, correction, export, and
        deletion requests subject to legal retention needs.
      </p>
      <p>
        Cookies and similar technologies may be used for sessions, preferences, and
        analytics. You can control cookies in your browser where supported.
      </p>
      <p>
        If you have questions about this policy or wish to exercise privacy rights, contact
        us through{' '}
        <Link href="/demo-request" className="text-primary underline">
          demo request
        </Link>{' '}
        or the contact channel provided by your account team.
      </p>
      <p className="text-xs text-muted-foreground">
        This page is a general summary and not legal advice. Your organization should
        review it with counsel and align it with your jurisdiction and data practices.
      </p>
    </SaasStaticPage>
  );
}
