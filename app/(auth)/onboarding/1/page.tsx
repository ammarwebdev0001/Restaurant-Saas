"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setOnboardingRestaurantId } from "@/lib/onboarding/storage";
import { OnboardingSteps } from "../OnboardingSteps";
import { ArrowRight, Loader2 } from "lucide-react";

export default function OnboardingStep1Page() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role;
      if (role && role !== "OWNER") {
        toast.error("Onboarding is for restaurant owners only.");
        router.replace("/home");
      }
    }
  }, [status, session, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/step1", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subdomain: subdomain.trim().toLowerCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data?.error === "string"
            ? data.error
            : data?.error?.fieldErrors
              ? "Check your inputs."
              : "Could not save restaurant."
        );
        return;
      }
      const id = data?.restaurant?.id as string | undefined;
      if (id) setOnboardingRestaurantId(id);
      toast.success("Restaurant created. Continue to branding.");
      router.push("/onboarding/2");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="rounded-lg border bg-background p-6 text-center text-sm text-muted-foreground flex items-center justify-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background p-6 shadow-sm">
      <OnboardingSteps active={1} />
      <h1 className="mb-1 text-xl font-semibold">Restaurant basics</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Your restaurant name and the URL domain guests will use (e.g.{" "}
        <span className="font-mono text-xs">your-name</span> →{" "}
        <span className="font-mono text-xs">your-name.yoursite.com</span>).
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Restaurant name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Taco Fiesta"
            required
            minLength={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subdomain">Domain name (URL slug)</Label>
          <Input
            id="subdomain"
            value={subdomain}
            onChange={(e) =>
              setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="e.g. taco-fiesta"
            required
            minLength={2}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers, and hyphens only. Must be unique.
          </p>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ?<>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> <span>Creating restaurant…</span>
          </> 
           : <>
           <span>Continue</span>
           <ArrowRight className="h-4 w-4 ml-2" />
           </>}
        </Button>
      </form>
    </div>
  );
}
