"use client";

import { cn } from "@/lib/utils";

const steps = [
  { n: 1 as const, label: "Basics" },
  { n: 2 as const, label: "Branding" },
  { n: 3 as const, label: "Branches" },
];

export function OnboardingSteps({ active }: { active: 1 | 2 | 3 }) {
  return (
    <div className="mb-8 flex items-center justify-between gap-2">
      {steps.map((s) => (
        <div
          key={s.n}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 rounded-md border px-2 py-2 text-center text-xs font-medium",
            active === s.n
              ? "border-primary bg-primary/10 text-foreground"
              : "border-transparent bg-muted/50 text-muted-foreground"
          )}
        >
          <span className="text-[0.65rem] uppercase tracking-wide">
            Step {s.n}
          </span>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
