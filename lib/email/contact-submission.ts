import { Resend } from "resend";

import { getAppBaseUrl } from "@/lib/app-base-url";

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

export async function sendContactSubmissionEmail(opts: {
  to: string[];
  firstName: string;
  email: string;
  company: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { to, firstName, email, company, message } = opts;
  if (to.length === 0) {
    return { ok: false, error: "No recipient addresses configured." };
  }

  const apiKey = getResendApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY is missing. Please configure it in .env.",
    };
  }

  const from = getFromAddress();
  const resend = new Resend(apiKey);
  const safeName =
    firstName.length > 80 ? `${firstName.slice(0, 80)}…` : firstName;
  const subject = `Website contact: ${safeName}`;
  const site = getAppBaseUrl();
  const html = `
    <p>New message from the Foodluk marketing contact form.</p>
    <table style="border-collapse:collapse;font-size:14px">
      <tr><td style="padding:4px 12px 4px 0;font-weight:600">Site</td><td>${escapeHtml(site)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600">Name</td><td>${escapeHtml(firstName)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600">Email</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top">Company</td><td>${escapeHtml(company || "—")}</td></tr>
    </table>
    <p style="margin-top:16px;font-weight:600">Message</p>
    <pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;margin:0">${escapeHtml(message)}</pre>
  `.trim();

  // One Resend call per admin: with Resend’s test domain, a single `to: [a,b]`
  // can fail entirely if any address isn’t allowed; separate sends still surface
  // per-recipient errors but at least one valid inbox can succeed.
  const errors: string[] = [];
  let anyOk = false;

  for (const recipient of to) {
    const { data, error } = await resend.emails.send({
      from,
      to: [recipient],
      replyTo: email,
      subject,
      html,
    });

    if (error) {
      const msg = error.message ?? "Failed to send email.";
      errors.push(`${recipient}: ${msg}`);
      console.error("[contact-submission] Resend error", {
        to: recipient,
        message: msg,
      });
      continue;
    }
    if (data?.id) {
      anyOk = true;
    } else {
      errors.push(`${recipient}: empty response from provider`);
    }
  }

  if (!anyOk) {
    return {
      ok: false,
      error:
        errors.length > 0
          ? errors.join(" ")
          : "Failed to send email.",
    };
  }

  return { ok: true };
}
