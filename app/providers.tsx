"use client";

import React, { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/lib/i18n/client";
import { OfflineBootstrap } from "@/components/offline/offline-bootstrap";

/**
 * Mount Vercel metrics after the first paint so they do not run in the same
 * React commit as a layout swap (e.g. dashboard → /pos). That combination
 * has triggered DOM/removeChild races with the App Router.
 */
function DeferredVercelMetrics() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!ready) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <NextTopLoader showSpinner={false} />
        <OfflineBootstrap />
        {children}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          draggable
          style={{ zIndex: 9999 }}
        />
        <DeferredVercelMetrics />
      </SessionProvider>
    </ThemeProvider>
  );
}

