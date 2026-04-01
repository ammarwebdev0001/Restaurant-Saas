import React from "react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-0px)] bg-muted/30 px-4 py-8 dark:bg-black">
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  );
}
