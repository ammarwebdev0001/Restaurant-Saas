type StorefrontBackgroundProps = {
  /** When true, mesh is softer so the photo banner stays readable. */
  hasBanner?: boolean;
};

/**
 * Generative mesh backdrop derived from `--restaurant-*` CSS variables
 * (set from the restaurant theme primary color in settings).
 */
export function StorefrontBackground({ hasBanner = false }: StorefrontBackgroundProps) {
  const meshOpacity = hasBanner ? '0.22' : '0.5';

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 min-h-[100dvh] overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background: hasBanner
            ? undefined
            : `linear-gradient(
                145deg,
                var(--restaurant-surface, #faf8ff) 0%,
                #ffffff 42%,
                color-mix(in srgb, var(--restaurant-accent, #e8eef5) 35%, white) 100%
              )`,
        }}
      />

      <div
        className="storefront-blob absolute -left-[18%] -top-[28%] h-[min(85vw,520px)] w-[min(85vw,520px)] rounded-full blur-3xl"
        style={{
          opacity: meshOpacity,
          background:
            'radial-gradient(circle at 30% 30%, var(--restaurant-glow, #fcd34d), transparent 68%)',
        }}
      />
      <div
        className="storefront-blob storefront-blob-delayed absolute -right-[12%] top-[8%] h-[min(70vw,440px)] w-[min(70vw,440px)] rounded-full blur-3xl"
        style={{
          opacity: meshOpacity,
          background:
            'radial-gradient(circle at 60% 40%, var(--restaurant-primary, #ea580c), transparent 72%)',
        }}
      />
      <div
        className="storefront-blob absolute bottom-[-18%] left-[22%] h-[min(75vw,480px)] w-[min(75vw,480px)] rounded-full blur-3xl"
        style={{
          opacity: hasBanner ? '0.18' : '0.38',
          animationDelay: '-10s',
          background:
            'radial-gradient(circle, var(--restaurant-accent, #c4b5fd), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(
              circle at 1px 1px,
              color-mix(in srgb, var(--restaurant-primary, #cbd5e1) 12%, transparent) 1px,
              transparent 0
            )`,
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  );
}
