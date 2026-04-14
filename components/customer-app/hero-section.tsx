import { Button } from '@/components/ui/button';

type HeroSectionProps = {
  restaurantName?: string;
  headline?: string;
  subheadline?: string;
  bannerUrl?: string;
  logoUrl?: string;
};

export function HeroSection({
  restaurantName = 'Restaurant',
  subheadline = 'Delivery & pickup — menu powered by your restaurant slug.',
  bannerUrl,
  logoUrl,
}: HeroSectionProps) {
  const initial = (restaurantName || 'R').charAt(0).toUpperCase();
  return (
    <section className="relative flex flex-col overflow-hidden rounded-3xl p-10 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,211,77,0.3),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(226,97,209,0.2),transparent_60%)]" />
      <div className="relative z-10 flex flex-1 flex-col justify-between gap-10">
        <div className="space-y-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-xl font-bold text-primary-foreground ring-1 ring-primary/20">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={`${restaurantName} logo`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.style.display = 'none';
                      }}
                    />
                  ) : (
                    initial
                  )}
                </span>
                <span className="text-lg font-semibold tracking-wide text-foreground">
                  {restaurantName}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{subheadline}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-card backdrop-blur">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt={`${restaurantName} banner`}
                className="h-48 w-full object-cover md:h-56"
              />
            ) : (
              <div className="p-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Banner not found
                </p>
                <div className="mt-4 flex items-end gap-4">
                  <p className="text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">
                    No banner available
                  </p>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Banner not exists. Go to Settings to add banners.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Small treats
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Enjoy the best offers available in-store. Find nearby
              restaurants and order in just a few clicks.
            </p>
          </div>
        </div>

        <footer className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Take advantage of the best offers
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-foreground"
              >
                App Store
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-foreground"
              >
                Google Play
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Powered by <span className="text-foreground">Belorder</span>
          </div>
        </footer>
      </div>
    </section>
  );
}