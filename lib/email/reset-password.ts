import { getAppBaseUrl } from "@/lib/app-base-url";
import { sendMail } from "@/lib/email/smtp";

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
  const resetUrl = buildResetPasswordUrl(token);

  // Localhost links almost always trigger spam filters (Gmail in particular
  // silent-drops messages containing http://localhost or 127.0.0.1). Log the
  // URL so you can always reset by pasting it into the browser in dev.
  const isLocalLink = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(
    resetUrl
  );
  if (isLocalLink) {
    console.warn(
      `[reset-password] dev reset link (localhost — Gmail may silently drop the email):\n  ${resetUrl}`
    );
  }

  // "Foodluk" leads the subject so the email is easy to find in busy inboxes
  // and so search/filter rules can target it reliably.
  const subject = "Foodluk — Reset your password";
  const html = `
    <p>Hello,</p>
    <p>We received a request to reset your <strong>Foodluk</strong> password.</p>
    <p>Click the link below to set a new password:</p>
    <p><a href="${resetUrl}">${escapeHtml(resetUrl)}</a></p>
    <p>If you did not request this, you can safely ignore this email — your password will stay the same.</p>
    <p>— The Foodluk team</p>
  `.trim();

  const text = [
    "Hello,",
    "",
    "We received a request to reset your Foodluk password.",
    "Open this link in your browser to set a new password:",
    "",
    resetUrl,
    "",
    "If you did not request this, you can ignore this email — your password will stay the same.",
    "",
    "— The Foodluk team",
  ].join("\n");

  const result = await sendMail({
    to,
    subject,
    html,
    text,
    fromName: "Foodluk",
  });
  if (!result.ok) {
    console.error("[reset-password] SMTP error", { to, error: result.error });
    return { ok: false, error: result.error };
  }
  console.info(`[reset-password] sent to=${to} id=${result.messageId}`);
  return { ok: true };
}
