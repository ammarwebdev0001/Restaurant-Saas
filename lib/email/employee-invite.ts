import { getAppBaseUrl } from '@/lib/app-base-url';
import {
  getSmtpConfigError,
  isSmtpConfigured,
  sendMail,
} from '@/lib/email/smtp';

export type EmailSendResult =
  | { ok: true; channel: 'smtp'; messageId: string }
  | { ok: true; channel: 'none'; reason: 'missing_smtp_config'; detail: string }
  | { ok: false; channel: 'smtp'; error: string };

/**
 * Send a transactional HTML email via SMTP (Gmail / Workspace / any SMTP host).
 *
 * Required env vars (see `lib/email/smtp.ts` and `.env.example`):
 *   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL
 *
 * When SMTP is not configured we don't fail — we return `channel: 'none'`
 * so callers can still respond "saved, but email skipped" and show the
 * recipient a manual link instead.
 */
async function sendHtmlEmail(opts: {
  to: string;
  subject: string;
  html: string;
  logTag: string;
  devDetail: string;
}): Promise<EmailSendResult> {
  if (!isSmtpConfigured()) {
    const detail = getSmtpConfigError() ?? 'SMTP is not configured';
    console.warn(
      `[${opts.logTag}] ${detail} — email not sent. Set SMTP_* vars in .env and restart.\n  ${opts.devDetail}`
    );
    return {
      ok: true,
      channel: 'none',
      reason: 'missing_smtp_config',
      detail,
    };
  }

  const result = await sendMail({
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (!result.ok) {
    console.error(`[SMTP:${opts.logTag}]`, result.error);
    return { ok: false, channel: 'smtp', error: result.error };
  }

  console.info(`[SMTP:${opts.logTag}] sent id=${result.messageId} to=${opts.to}`);
  return { ok: true, channel: 'smtp', messageId: result.messageId };
}

export async function sendEmployeeInviteEmail(opts: {
  to: string;
  acceptUrl: string;
  restaurantName: string;
}): Promise<EmailSendResult> {
  const { to, acceptUrl, restaurantName } = opts;
  const subject = `Invitation to join ${restaurantName}`;
  const html = `
    <p>You have been invited to join <strong>${escapeHtml(restaurantName)}</strong> on the restaurant dashboard.</p>
    <p><a href="${acceptUrl}">Accept invitation</a></p>
    <p>If you did not expect this, you can ignore this email.</p>
  `.trim();

  return sendHtmlEmail({
    to,
    subject,
    html,
    logTag: 'employee-invite',
    devDetail: acceptUrl,
  });
}

export async function sendNewEmployeeLoginReadyEmail(opts: {
  to: string;
  restaurantName: string;
}): Promise<EmailSendResult> {
  const { to, restaurantName } = opts;
  const loginUrl = `${getAppBaseUrl()}/login`;
  const subject = `You're on the team at ${restaurantName}`;
  const html = `
    <p>Your account for <strong>${escapeHtml(restaurantName)}</strong> is ready.</p>
    <p><a href="${loginUrl}">Sign in to the dashboard</a> with the password your manager set for you.</p>
  `.trim();

  return sendHtmlEmail({
    to,
    subject,
    html,
    logTag: 'new-employee-login',
    devDetail: `login: ${loginUrl}`,
  });
}

export async function sendNewEmployeeWelcomeEmail(opts: {
  to: string;
  restaurantName: string;
  setPasswordUrl: string;
}): Promise<EmailSendResult> {
  const { to, restaurantName, setPasswordUrl } = opts;
  const subject = `Your account for ${restaurantName}`;
  const html = `
    <p>An account was created for you at <strong>${escapeHtml(restaurantName)}</strong>.</p>
    <p><a href="${setPasswordUrl}">Set your password</a> to sign in.</p>
  `.trim();

  return sendHtmlEmail({
    to,
    subject,
    html,
    logTag: 'new-employee-welcome',
    devDetail: setPasswordUrl,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildRestaurantInviteAcceptUrl(token: string): string {
  return `${getAppBaseUrl()}/invite/restaurant?token=${encodeURIComponent(token)}`;
}
