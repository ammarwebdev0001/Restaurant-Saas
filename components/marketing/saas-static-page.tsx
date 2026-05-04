import type { ReactNode } from 'react';

type SaasStaticPageProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Shared wrapper for public SaaS marketing / legal pages (not the restaurant dashboard).
 */
export function SaasStaticPage({ title, subtitle, children }: SaasStaticPageProps) {
  return (
    <main className="min-h-screen bg-muted/20 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>
        ) : null}
        <div className="mt-10 space-y-5 text-sm leading-relaxed text-foreground [&_h2]:mt-12 [&_h2]:scroll-mt-24 [&_h2]:border-b [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:first:mt-0 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </div>
    </main>
  );
}
