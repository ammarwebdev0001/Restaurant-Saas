import Link from 'next/link';

import { SaasStaticPage } from '@/components/marketing/saas-static-page';

const ORDER_PATH_PAGES = {
  'click-and-collect': {
    title: 'Click and Collect',
    subtitle:
      'Enable customers to order ahead online and pick up in-store without waiting in line.',
    points: [
      'Offer scheduled pickup slots to reduce congestion at peak times.',
      'Send instant order-ready confirmations to improve handoff speed.',
      'Keep menu, pricing, and availability synced in real time.',
    ],
  },
  'curbside-pickup': {
    title: 'Curbside Pickup',
    subtitle:
      'Let customers collect orders from their vehicle with fast check-in and staff alerts.',
    points: [
      'Capture vehicle notes and arrival details during checkout.',
      'Notify staff when customers arrive for faster service.',
      'Reduce in-store crowding while preserving a premium experience.',
    ],
  },
  'customer-facing-delivery': {
    title: 'Customer-Facing Delivery',
    subtitle:
      'Power direct delivery orders through your own branded ordering experience.',
    points: [
      'Take direct delivery orders without marketplace dependency.',
      'Collect delivery information and customer preferences at checkout.',
      'Track status updates from order placement to handoff.',
    ],
  },
  'table-orders': {
    title: 'Table Orders',
    subtitle:
      'Support dine-in ordering from table to kitchen with a cleaner in-venue workflow.',
    points: [
      'Let guests place and review orders by table context.',
      'Route tickets clearly to operations and kitchen workflows.',
      'Reduce order errors with structured order capture.',
    ],
  },
  'mobile-ordering-application': {
    title: 'Mobile Ordering Application',
    subtitle:
      'Give customers a mobile-first ordering journey aligned with your restaurant brand.',
    points: [
      'Deliver a fast mobile ordering flow for repeat customers.',
      'Promote best-sellers and high-margin items through smart positioning.',
      'Unify ordering data across pickup, delivery, and dine-in channels.',
    ],
  },
} as const;

export type OrderPathSlug = keyof typeof ORDER_PATH_PAGES;

export function OrderPathContent({ slug }: { slug: OrderPathSlug }) {
  const page = ORDER_PATH_PAGES[slug];

  return (
    <SaasStaticPage title={page.title} subtitle={page.subtitle}>
      <h2>What this includes</h2>
      <ul>
        {page.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <h2>Next step</h2>
      <p>
        Want this flow configured for your restaurant setup?{' '}
        <Link href="/demo-request" className="text-primary underline">
          Request a demo
        </Link>{' '}
        and our team will walk you through the launch path.
      </p>
    </SaasStaticPage>
  );
}
