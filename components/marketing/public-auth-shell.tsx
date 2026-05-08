import type { ReactNode } from 'react';

type PublicAuthShellProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function PublicAuthShell({ title, subtitle, children }: PublicAuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10 text-zinc-900 dark:bg-black dark:text-white">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-fire-500/20 blur-3xl dark:bg-fire-500/25" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-fire-300/20 blur-3xl dark:bg-fire-700/25" />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white/95 p-6 shadow-[0_20px_60px_-25px] shadow-black/20 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/85 dark:shadow-black/70">
        {title ? <h1 className="mb-2 text-center text-2xl font-semibold">{title}</h1> : null}
        {subtitle ? (
          <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </main>
  );
}
