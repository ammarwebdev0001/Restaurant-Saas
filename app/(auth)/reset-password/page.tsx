"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicAuthShell } from "@/components/marketing/public-auth-shell";

function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = tokenFromUrl ?? generatedToken;
  const isConfirmMode = !!token;

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to request reset.");
        return;
      }

      toast.success("Reset requested. Use the token below to continue.");
      if (data?.token) setGeneratedToken(String(data.token));
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to request reset.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Missing reset token.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to reset password.");
        return;
      }

      toast.success("Password reset successful. Please sign in.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthShell
      title="Reset password"
      subtitle="Request a reset token, then set a new password."
    >

        {!isConfirmMode ? (
          <form onSubmit={requestReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <Button disabled={loading} type="submit">
              {loading ? "Requesting..." : "Request reset token"}
            </Button>

            {generatedToken && (
              <div className="rounded-md border bg-muted/30 p-3 text-xs">
                <div className="mb-2 font-medium">Your reset token</div>
                <div className="break-all font-mono">{generatedToken}</div>
                <div className="mt-3 text-center">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      router.push(`/reset-password?token=${generatedToken}`)
                    }
                  >
                    Use this token
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center text-sm">
              <Link className="text-primary underline" href="/login">
                Back to login
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="flex flex-col gap-4">
            <div className="rounded-md border bg-muted/30 p-3 text-xs">
              <div className="mb-1 font-medium">Token from URL</div>
              <div className="break-all font-mono">{token}</div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <Button disabled={loading} type="submit">
              {loading ? "Resetting..." : "Reset password"}
            </Button>

            <div className="text-center text-sm">
              <Link className="text-primary underline" href="/login">
                Back to login
              </Link>
            </div>
          </form>
        )}
    </PublicAuthShell>
  );
}

export default function ResetPasswordPageWithSuspense() {
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
      <ResetPasswordPage />
    </Suspense>
  );
}
