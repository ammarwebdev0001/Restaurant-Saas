"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/lib/i18n/client";
import { OfflineBootstrap } from "@/components/offline/offline-bootstrap";
import { LanguageSwitcher } from "@/components/main/language-switcher";

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
        <LanguageSwitcher />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          draggable
          style={{ zIndex: 9999 }}
        />
        <Analytics />
        <SpeedInsights />
      </SessionProvider>
    </ThemeProvider>
  );
}

