import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary px-6 py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-3">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">Legal</p>
          <ul className="space-y-1 text-xs text-white/75">
            <li>General Terms and Conditions of Sale</li>
            <li>General Terms of Use</li>
            <li>Cookie Policy</li>
            <li>Privacy Policy</li>
            <li>Legal notice</li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">
            Take advantage of the best offers
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="text-foreground">
              App Store
            </Button>
            <Button variant="outline" size="sm" className="text-foreground">
              Google Play
            </Button>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 text-xs text-white/75">
          <p>
            Powered by <span className="text-white">Belorder</span>
          </p>
          <p>Enjoy Tacos v2.0</p>
        </div>
      </div>
    </footer>
  );
}