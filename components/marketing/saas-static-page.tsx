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
    <main className="relative min-h-screen overflow-hidden bg-white px-6 py-16 text-zinc-900 dark:bg-black dark:text-white">
      <div className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-fire-500/20 blur-3xl dark:bg-fire-500/25" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-fire-300/20 blur-3xl dark:bg-fire-700/20" />
      <div className="relative mx-auto max-w-3xl rounded-3xl border border-zinc-200/80 bg-white/95 p-8 shadow-[0_30px_80px_-30px] shadow-black/20 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:shadow-black/60 md:p-10">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
        {subtitle ? (
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        ) : null}
        <div className="mt-10 space-y-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_h2]:mt-12 [&_h2]:scroll-mt-24 [&_h2]:border-b [&_h2]:border-zinc-200 [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_h2]:first:mt-0 dark:[&_h2]:border-zinc-800 dark:[&_h2]:text-white [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:text-fire-600 [&_a]:underline dark:[&_a]:text-fire-400">
          {children}
        </div>
      </div>
    </main>
  );
}
