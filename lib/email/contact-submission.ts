import { getAppBaseUrl } from "@/lib/app-base-url";
import { sendMail } from "@/lib/email/smtp";

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

  const safeName =
    firstName.length > 80 ? `${firstName.slice(0, 80)}…` : firstName;
  // "Foodluk" leads the subject so the brand is visible even when a mail
  // client overrides the From display name with a saved contact's name.
  const subject = `Foodluk — Contact form: ${safeName}`;
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

  // Single SMTP message addressed to all admins — Gmail will deliver one
  // email to each recipient on the To line.
  const result = await sendMail({
    to,
    subject,
    html,
    replyTo: email,
    // Force the From display name to "Foodluk" — overrides whatever
    // SMTP_FROM_EMAIL was set to so the brand always shows in the inbox.
    fromName: "Foodluk",
  });

  if (!result.ok) {
    console.error("[contact-submission] SMTP error", {
      to,
      message: result.error,
    });
    return { ok: false, error: result.error };
  }

  return { ok: true };
}
