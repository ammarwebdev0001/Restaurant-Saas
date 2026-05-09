import { Resend } from "resend";

import { getAppBaseUrl } from "@/lib/app-base-url";

/** Strip common .env mistakes: surrounding quotes and BOM. */
function normalizeEnv(value: string | undefined): string {
  if (value == null || value === "") return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  if (v.charCodeAt(0) === 0xfeff) {
    v = v.slice(1);
  }
  return v;
}

function getResendApiKey(): string {
  return normalizeEnv(process.env.RESEND_API_KEY);
}

function getFromAddress(): string {
  const raw = normalizeEnv(process.env.RESEND_FROM_EMAIL);
  return raw || "onboarding@resend.dev";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildResetPasswordUrl(token: string): string {
  return `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendResetPasswordEmail(opts: {
  to: string;
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { to, token } = opts;
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY is missing. Please configure it in .env.",
    };
  }

  const resetUrl = buildResetPasswordUrl(token);
  const from = getFromAddress();
  const resend = new Resend(apiKey);
  const subject = "Reset your password";
  const html = `
    <p>We received a request to reset your password.</p>
    <p><a href="${resetUrl}">Reset password</a></p>
    <p>If the button does not work, paste this link in your browser:</p>
    <p>${escapeHtml(resetUrl)}</p>
    <p>If you did not request this, you can ignore this email.</p>
  `.trim();

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    return { ok: false, error: error.message ?? "Failed to send reset email." };
  }
  if (!data?.id) {
    return { ok: false, error: "Email provider returned empty response." };
  }

  return { ok: true };
}
