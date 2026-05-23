import { StorefrontBackground } from '@/components/customer-app/storefront-background';



type StorefrontLayeredBackgroundProps = {
  bannerUrl?: string | null;
};

/**
 * Fixed layers: main banner stays on screen while content scrolls;
 * food imagery fixed at the bottom of the viewport.
 */
export function StorefrontLayeredBackground({
  bannerUrl,
}: StorefrontLayeredBackgroundProps) {
  const bannerSrc = bannerUrl?.trim() ?? '';
  const hasBanner = Boolean(bannerSrc);

  return (
    <>
      {/* Themed mesh — scrolls with page (behind fixed layers) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 min-h-full">
        <StorefrontBackground hasBanner={false} />
      </div>

      {/* Food atmosphere — fixed at viewport bottom */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[62vh] min-h-[380px] max-h-[720px]"
      >
        
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to top,
              color-mix(in srgb, var(--restaurant-surface, #faf8ff) 88%, transparent) 0%,
              color-mix(in srgb, var(--restaurant-surface, #ffffff) 55%, transparent) 38%,
              transparent 72%
            )`,
          }}
        />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: `linear-gradient(
              120deg,
              color-mix(in srgb, var(--restaurant-primary, #ea580c) 12%, transparent) 0%,
              transparent 50%,
              color-mix(in srgb, var(--restaurant-glow, #fcd34d) 18%, transparent) 100%
            )`,
          }}
        />
      </div>

      {/* Main banner — fixed full viewport, fades at bottom into food */}
      {hasBanner ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full"
        >
          <img
            src={bannerSrc}
            alt=""
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center"
            style={{
              maskImage:
                'linear-gradient(to bottom, black 0%, black 58%, rgba(0,0,0,0.55) 78%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, black 0%, black 58%, rgba(0,0,0,0.55) 78%, transparent 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                180deg,
                color-mix(in srgb, var(--restaurant-deep, #0f172a) 42%, transparent) 0%,
                color-mix(in srgb, var(--restaurant-primary, #ea580c) 16%, transparent) 38%,
                transparent 62%,
                color-mix(in srgb, var(--restaurant-surface, #ffffff) 50%, transparent) 90%,
                transparent 100%
              )`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-32 sm:h-40"
            style={{
              background: `linear-gradient(
                to bottom,
                transparent 0%,
                color-mix(in srgb, var(--restaurant-surface, #ffffff) 30%, transparent) 50%,
                var(--restaurant-surface, #ffffff) 100%
              )`,
            }}
          />
        </div>
      ) : null}
    </>
  );
}
