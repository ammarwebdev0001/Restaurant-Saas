import { WebAppStorefront } from '@/components/customer-app/web-app-storefront';

export default async function WebAppBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <WebAppStorefront slug={slug} />;
}
