import { ModeToggle } from '@/components/darkmode/darkmode';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Footer from '@/components/main/footer';
import Header from '@/components/main/header';

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gray-100 text-foreground dark:bg-black">
      <Header />

      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background via-background to-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <span className="inline-flex rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          Foodluk SAAS Platform
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Run your restaurant faster with one modern system.
          </h1>

          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Manage orders, menu, branches, branding, and daily operations from
            one dashboard. Launch your online ordering experience in minutes.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button className="h-11 rounded-xl px-6 text-sm" asChild>
              <Link href="/register">Start Free</Link>
            </Button>
            <Button
              className="h-11 rounded-xl px-6 text-sm"
              variant="secondary"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
            {/* <Button
              className="h-11 rounded-xl px-6 text-sm"
              variant="outline"
              asChild
            >
              <Link href="/web-app/restaurant">View Demo Store</Link>
            </Button> */}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-background p-4">
              <p className="text-2xl font-bold">+85%</p>
              <p className="text-sm text-muted-foreground">
                Faster order handling
              </p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-2xl font-bold">3x</p>
              <p className="text-sm text-muted-foreground">
                Quicker setup for new branches
              </p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-sm text-muted-foreground">
                Cloud access for your team
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold md:text-3xl">
            Everything in one workspace
          </h2>
          <p className="mt-2 text-muted-foreground">
            Replace disconnected tools with one restaurant-first operating
            system.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-xl border bg-background p-5">
            <h3 className="font-semibold">Menu & pricing control</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Update items, prices, categories, and stock from a single panel.
            </p>
          </article>
          <article className="rounded-xl border bg-background p-5">
            <h3 className="font-semibold">Branch operations</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage multiple locations with role-based access and visibility.
            </p>
          </article>
          <article className="rounded-xl border bg-background p-5">
            <h3 className="font-semibold">Order lifecycle tracking</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Track every order from placement to completion with fewer
              mistakes.
            </p>
          </article>
          <article className="rounded-xl border bg-background p-5">
            <h3 className="font-semibold">Analytics dashboard</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitor sales, popular products, and performance in real time.
            </p>
          </article>
          <article className="rounded-xl border bg-background p-5">
            <h3 className="font-semibold">Brand customization</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your logo, banners, and customer-facing branding quickly.
            </p>
          </article>
          <article className="rounded-xl border bg-background p-5">
            <h3 className="font-semibold">Secure authentication</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Google and credentials login with role-based onboarding flows.
            </p>
          </article>
        </div>
      </section>
      <Footer />
    </main>
  );
}
