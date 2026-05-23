import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
};

export function GlassPanel({ children, className, id, style }: GlassPanelProps) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-28 rounded-3xl border p-6 shadow-lg backdrop-blur-xl sm:p-8',
        className
      )}
      style={{
        borderColor: 'var(--restaurant-glass-border, #e2e8f0)',
        background: 'var(--restaurant-glass, rgba(255, 255, 255, 0.78))',
        boxShadow:
          '0 24px 60px -24px color-mix(in srgb, var(--restaurant-primary, #0f172a) 28%, transparent)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 space-y-1', className)}>
      <div className="flex items-center gap-3">
        <span className="h-8 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
        <h2 className="text-xl font-semibold tracking-tight text-[#0f172a] sm:text-2xl">
          {title}
        </h2>
      </div>
      {subtitle ? (
        <p className="pl-4 text-sm leading-relaxed text-[#64748b] sm:pl-5">{subtitle}</p>
      ) : null}
    </div>
  );
}
