import Link from 'next/link';

const docs = [
  {
    title: 'Getting Started',
    text: 'Create your account, pick OWNER role, and finish onboarding.',
  },
  {
    title: 'Restaurant Setup',
    text: 'Set name/domain, upload logo and banners, then configure branches.',
  },
  {
    title: 'Orders & Operations',
    text: 'Track sales, monitor stock, and manage transactions from dashboard.',
  },
  {
    title: 'Authentication',
    text: 'Use Google or email/password, reset password, and role-based access.',
  },
];

export default function DocumentationPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold">Documentation</h1>
        <p className="mt-3 text-muted-foreground">
          Learn how to launch, configure, and run your restaurant with the platform.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {docs.map((item) => (
            <article key={item.title} className="rounded-xl border bg-muted/20 p-5">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Need help?{' '}
          <Link href="/demo-request" className="underline">
            Request a demo
          </Link>{' '}
          and our team can walk you through.
        </p>
      </div>
    </main>
  );
}

