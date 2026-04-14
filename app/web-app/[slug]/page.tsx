import { WebAppStorefront } from '@/components/customer-app/web-app-storefront';

export default async function WebAppBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <WebAppStorefront slug={slug} />
    </main>
  );
}
