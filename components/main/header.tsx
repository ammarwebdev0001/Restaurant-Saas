import Image from 'next/image';
import Link from 'next/link';
import { ModeToggle } from '../darkmode/darkmode';
import LandingAuthActions from '../marketing/LandingAuthActions';

export default function Header() {
  return (
    <header>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 justify-center font-semibold tracking-wide"
        >
          <Image
            src="/Logo.png"
            alt="Foodluk"
            width={32}
            height={32}
            className="h-7 w-7 shrink-0 object-contain"
            priority
          />
          <span className="text-2xl">Foodluk</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link href="/demo-request" className="hover:text-foreground">
            Demo Request
          </Link>
          <Link href="/restaurant-signup" className="hover:text-foreground">
            Restaurant Signup
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/documentation" className="hover:text-foreground">
            Documentation
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <LandingAuthActions />
        </div>
      </div>
    </header>
  );
}
