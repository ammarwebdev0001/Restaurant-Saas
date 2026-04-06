import { Resend } from 'resend';

import { getAppBaseUrl } from '@/lib/app-base-url';

/** Strip common .env mistakes: surrounding quotes and BOM. */
function normalizeEnv(value: string | undefined): string {
  if (value == null || value === '') return '';
  let v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  if (v.charCodeAt(0) === 0xfeff) {
    v = v.slice(1);
  }
  return v;
}

export type EmailSendResult =
  | { ok: true; channel: 'resend'; messageId: string }
  | { ok: true; channel: 'none'; reason: 'missing_resend_api_key' }
  | { ok: false; channel: 'resend'; error: string };

function getResendApiKey(): string {
  return normalizeEnv(process.env.RESEND_API_KEY);
}

function getFromAddress(): string {
  const raw = normalizeEnv(process.env.RESEND_FROM_EMAIL);
  return raw || 'onboarding@resend.dev';
}

/**
 * Resend (server-side only):
 * - `RESEND_API_KEY` — from https://resend.com/api-keys
 * - `RESEND_FROM_EMAIL` — must be allowed by Resend (verified domain or onboarding@resend.dev for testing)
 *
 * Testing with `onboarding@resend.dev`: Resend often only delivers to the **account owner** email until you verify a domain.
 */
async function sendHtmlEmail(opts: {
  to: string;
  subject: string;
  html: string;
  logTag: string;
  devDetail: string;
}): Promise<EmailSendResult> {
  const apiKey = getResendApiKey();
  const from = getFromAddress();

  if (!apiKey) {
    console.warn(
      `[${opts.logTag}] RESEND_API_KEY missing — email not sent. Set it in .env and restart the dev server.\n  ${opts.devDetail}`
    );
    return { ok: true, channel: 'none', reason: 'missing_resend_api_key' };
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    const detail = error.message ?? String(error.name ?? 'Resend error');
    console.error(`[Resend:${opts.logTag}]`, detail, error);
    return {
      ok: false,
      channel: 'resend',
      error: `${detail} (from: ${from}). With the test sender, you may only send to your Resend account email until a domain is verified.`,
    };
  }

  if (!data?.id) {
    console.error(`[Resend:${opts.logTag}] unexpected empty response`);
    return {
      ok: false,
      channel: 'resend',
      error: 'Resend returned no message id.',
    };
  }

  console.info(`[Resend:${opts.logTag}] sent id=${data.id} to=${opts.to}`);
  return { ok: true, channel: 'resend', messageId: data.id };
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
