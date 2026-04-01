"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOnboardingRestaurantId } from "@/lib/onboarding/storage";
import { OnboardingSteps } from "../OnboardingSteps";

export default function OnboardingStep2Page() {
  const router = useRouter();
  const { status } = useSession();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [mainBannerUrl, setMainBannerUrl] = useState("");
  const [menuBanners, setMenuBanners] = useState<string[]>([""]);
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

  function addMenuBannerRow() {
    setMenuBanners((prev) => [...prev, ""]);
  }

  function setMenuBanner(i: number, v: string) {
    setMenuBanners((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  function removeMenuBanner(i: number) {
    setMenuBanners((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save(goNext: boolean) {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const urls = menuBanners.map((u) => u.trim()).filter(Boolean);
      const res = await fetch("/api/onboarding/step2", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          logoUrl: logoUrl.trim() || undefined,
          mainBannerUrl: mainBannerUrl.trim() || undefined,
          menuBannerUrls: urls.length ? urls : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Could not save branding.");
        return;
      }
      if (goNext) {
        toast.success("Saved.");
        router.push("/onboarding/3");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await save(true);
  }

  function skip() {
    router.push("/onboarding/3");
  }

  if (status === "loading" || !restaurantId) {
    return (
      <div className="rounded-lg border bg-background p-6 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background p-6 shadow-sm">
      <OnboardingSteps active={2} />
      <h1 className="mb-1 text-xl font-semibold">Branding (optional)</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Add image URLs for your logo, main banner, and banners shown in the
        menu. You can skip this step.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mainBannerUrl">Main banner URL (optional)</Label>
          <Input
            id="mainBannerUrl"
            type="url"
            value={mainBannerUrl}
            onChange={(e) => setMainBannerUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Menu banners</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMenuBannerRow}
            >
              Add image
            </Button>
          </div>
          {menuBanners.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => setMenuBanner(i, e.target.value)}
                placeholder={`Menu banner ${i + 1} URL`}
              />
              {menuBanners.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMenuBanner(i)}
                  aria-label="Remove"
                >
                  ×
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={skip}
            disabled={loading}
          >
            Skip this step
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}
