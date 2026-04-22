import { Button } from '@/components/ui/button';

type HeroSectionProps = {
  restaurantName?: string;
  headline?: string;
  subheadline?: string;
  bannerUrl?: string;
  logoUrl?: string;
  /** When true, skip the large hero banner block (e.g. banner is used as full-page background). */
  hideLargeBanner?: boolean;
};

export function HeroSection({
  restaurantName = 'Restaurant',
  subheadline = 'Delivery & pickup — menu powered by your restaurant slug.',
  bannerUrl,
  logoUrl,
  hideLargeBanner = false,
}: HeroSectionProps) {
  const initial = (restaurantName || 'R').charAt(0).toUpperCase();
  return (
    <section className="relative flex flex-col overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white p-10 text-[#0f172a] shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,211,77,0.35),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(226,97,209,0.22),transparent_60%)]" />
      <div className="relative z-10 flex flex-1 flex-col justify-between gap-10">
        <div className="space-y-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-bold text-primary ring-1 ring-primary/20">
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
                <span className="text-lg font-semibold tracking-wide text-[#0f172a]">
                  {restaurantName}
                </span>
              </div>
              <p className="text-sm text-[#64748b]">{subheadline}</p>
            </div>
          </div>

          {!hideLargeBanner ? (
            <div className="overflow-hidden rounded-3xl border border-[#e2e8f0] bg-[#fafafa] backdrop-blur">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt={`${restaurantName} banner`}
                  className="h-48 w-full object-cover md:h-56"
                />
              ) : (
                <div className="p-8">
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#64748b]">
                    Banner not found
                  </p>
                  <div className="mt-4 flex items-end gap-4">
                    <p className="text-3xl font-black leading-tight tracking-tight text-[#0f172a] md:text-4xl">
                      No banner available
                    </p>
                  </div>
                  <p className="mt-4 text-sm text-[#64748b]">
                    Banner not exists. Go to Settings to add banners.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Small treats
            </span>
            <p className="text-sm leading-relaxed text-[#475569]">
              Enjoy the best offers available in-store. Find nearby restaurants and order in
              just a few clicks.
            </p>
          </div>
        </div>

        <footer className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Take advantage of the best offers
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#cbd5e1] bg-white text-[#0f172a] hover:bg-[#f1f5f9]"
              >
                App Store
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#cbd5e1] bg-white text-[#0f172a] hover:bg-[#f1f5f9]"
              >
                Google Play
              </Button>
            </div>
          </div>

          <div className="text-xs text-[#64748b]">
            Powered by <span className="text-[#0f172a]">Belorder</span>
          </div>
        </footer>
      </div>
    </section>
  );
}
