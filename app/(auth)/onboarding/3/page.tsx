"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearOnboardingRestaurantId,
  getOnboardingRestaurantId,
} from "@/lib/onboarding/storage";
import { OnboardingSteps } from "../OnboardingSteps";
import { ArrowRight, Loader2, Trash2 } from "lucide-react";

type BranchRow = { name: string; address: string; phone: string };

export default function OnboardingStep3Page() {
  const router = useRouter();
  const { status } = useSession();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [rows, setRows] = useState<BranchRow[]>([
    { name: "", address: "", phone: "" },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    const id = getOnboardingRestaurantId();
    if (!id) {
      toast.error("Complete step 1 first.");
      router.replace("/onboarding/1");
      return;
    }
    setRestaurantId(id);
  }, [status, router]);

  function addRow() {
    setRows((r) => [...r, { name: "", address: "", phone: "" }]);
  }

  function updateRow(i: number, field: keyof BranchRow, v: string) {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: v };
      return next;
    });
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function finish(skipBranches: boolean) {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const branches = skipBranches
        ? []
        : rows
            .map((r) => ({
              name: r.name.trim(),
              address: r.address.trim(),
              phone: r.phone.trim(),
            }))
            .filter((r) => r.name.length > 0);

      if (!skipBranches && rows.some((r) => r.name.trim() === "" && (r.address || r.phone))) {
        toast.error("Name is required for each branch row you fill in.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/onboarding/step3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, branches }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Could not save branches.");
        return;
      }
      clearOnboardingRestaurantId();
      toast.success(
        skipBranches || branches.length === 0
          ? "You’re all set!"
          : "Branches saved."
      );
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await finish(false);
  }

  function skip() {
    void finish(true);
  }

  if (status === "loading" || !restaurantId) {
    return (
      <div className="rounded-lg border bg-background p-6 text-center text-sm text-muted-foreground flex items-center justify-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background p-6 shadow-sm">
      <OnboardingSteps active={3} />
      <h1 className="mb-1 text-xl font-semibold">Branches (optional)</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Add one or more locations. You can skip and add them later.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {rows.map((row, i) => (
          <div
            key={i}
            className="space-y-3 rounded-md border border-dashed p-3"
          >
            <div className="flex items-center justify-between">
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeRow(i)}
                >
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Remove</span>
                  </>
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`name-${i}`}>Name</Label>
              <Input
                id={`name-${i}`}
                value={row.name}
                onChange={(e) => updateRow(i, "name", e.target.value)}
                placeholder="Downtown location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`addr-${i}`}>Address (optional)</Label>
              <Input
                id={`addr-${i}`}
                value={row.address}
                onChange={(e) => updateRow(i, "address", e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`phone-${i}`}>Phone (optional)</Label>
              <Input
                id={`phone-${i}`}
                value={row.phone}
                onChange={(e) => updateRow(i, "phone", e.target.value)}
                placeholder="+1 …"
              />
            </div>
          </div>
        ))}

      

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={skip}
            disabled={loading}
          >
            Skip — finish without branches
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> <span>Finishing...</span>
            </> : <>
            <span>Finish</span>
            <ArrowRight className="h-4 w-4 ml-2" />
            </>}
          </Button>
        </div>
      </form>
    </div>
  );
}
