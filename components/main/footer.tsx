import Link from 'next/link';
import { Button } from '../ui/button';

export default function Footer() {
  return (
    <footer>
      <section className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-center">
          <div>
            <h3 className="text-2xl font-semibold">
              Start building your digital restaurant today
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your account, set up your brand, and launch your first
              branch.
            </p>
            <nav
              aria-label="Legal and product"
              className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/60 pt-6 text-sm text-muted-foreground"
            >
              <Link href="/documentation" className="hover:text-foreground">
                Documentation
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/policies" className="hover:text-foreground">
                Policies
              </Link>
              <Link href="/subscription-returns" className="hover:text-foreground">
                Subscription returns &amp; exchanges
              </Link>
            </nav>
          </div>
          <Button className="h-11 rounded-xl px-6" asChild>
            <Link href="/register">Create Account</Link>
          </Button>
        </div>
      </section>
    </footer>
  );
}
