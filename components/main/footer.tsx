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
          </div>
          <Button className="h-11 rounded-xl px-6" asChild>
            <Link href="/register">Create Account</Link>
          </Button>
        </div>
      </section>
    </footer>
  );
}
