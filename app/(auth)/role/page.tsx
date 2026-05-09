"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { PublicAuthShell } from "@/components/marketing/public-auth-shell";
import { isPlatformAdmin } from "@/lib/auth/admin";

type Role = "OWNER" | "WORKER";

const ALLOWED: Role[] = ["OWNER", "WORKER"];

function RolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const desiredRole = searchParams.get("role");
  const parsedDesiredRole = useMemo<Role | null>(() => {
    if (!desiredRole) return null;
    if (ALLOWED.includes(desiredRole as Role)) return desiredRole as Role;
    return null;
  }, [desiredRole]);

  const [loading, setLoading] = useState(false);

  const currentRole = (session?.user as any)?.role as string | undefined;
  const roleNeedsUpdate =
    status === "authenticated" && (!currentRole || currentRole === "UNKNOW");

  async function updateRole(role: Role) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to update role.");
        return;
      }

      toast.success("Signup successful.");
      if (role === "OWNER") {
        router.replace("/onboarding/1");
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update role.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") return;

    // If they already have a role, send them to the app (platform admin → SaaS admin).
    if (currentRole && currentRole !== "UNKNOW") {
      router.replace(
        isPlatformAdmin(session?.user?.email, currentRole)
          ? "/admin/dashboard"
          : "/dashboard"
      );
      return;
    }

    // If a desired role was provided (Google owner/worker signup), apply it automatically.
    if (roleNeedsUpdate && parsedDesiredRole) {
      updateRole(parsedDesiredRole);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentRole, roleNeedsUpdate, parsedDesiredRole]);

  if (status === "loading" || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 dark:bg-black">
        <div className="text-center text-sm text-muted-foreground">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <PublicAuthShell title="Your role" subtitle="Select a role to finish signup.">

        {roleNeedsUpdate ? (
          <div className="flex flex-col gap-3">
            <Button disabled={loading} onClick={() => updateRole("OWNER")}>
              Continue as Owner
            </Button>
            <Button disabled={loading} onClick={() => updateRole("WORKER")}>
              Continue as Worker
            </Button>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Redirecting...
          </div>
        )}
    </PublicAuthShell>
  );
}

export default function RolePageWithSuspense() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 dark:bg-black">
          <div className="text-center text-sm text-muted-foreground">
            Loading…
          </div>
        </main>
      }
    >
      <RolePage />
    </Suspense>
  );
}
