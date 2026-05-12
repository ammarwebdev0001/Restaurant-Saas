import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

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

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

function readSmtpConfig(): SmtpConfig | { error: string } {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  // Gmail App Passwords are 16 chars with optional spaces between groups.
  // Accept either form — strip spaces so nodemailer sees the raw password.
  const pass = normalizeEnv(process.env.SMTP_PASSWORD).replace(/\s+/g, "");
  if (!host) return { error: "SMTP_HOST is not set" };
  if (!user) return { error: "SMTP_USER is not set" };
  if (!pass)
    return {
      error:
        "SMTP_PASSWORD is not set. For Gmail use a 16-char App Password, not your account password.",
    };

  const portRaw = normalizeEnv(process.env.SMTP_PORT);
  const port = Number(portRaw) || 587;
  // Explicit override; otherwise infer from port (465 = TLS, else STARTTLS).
  const secureRaw = normalizeEnv(process.env.SMTP_SECURE).toLowerCase();
  const secure =
    secureRaw === "true" ? true : secureRaw === "false" ? false : port === 465;

  const from = normalizeEnv(process.env.SMTP_FROM_EMAIL) || user;

  return { host, port, secure, user, pass, from };
}

export function isSmtpConfigured(): boolean {
  return !("error" in readSmtpConfig());
}

export function getSmtpConfigError(): string | null {
  const cfg = readSmtpConfig();
  return "error" in cfg ? cfg.error : null;
}

let cached: { key: string; transporter: Transporter; verified: boolean } | null =
  null;

function getTransporter(cfg: SmtpConfig): Transporter {
  // Rebuild when env vars change between hot reloads.
  const key = `${cfg.host}|${cfg.port}|${cfg.secure}|${cfg.user}`;
  if (cached && cached.key === key) return cached.transporter;

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    // Lightweight pooling avoids Gmail "Too many connections" when bursting.
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });
  cached = { key, transporter, verified: false };

  // Fire-and-forget verify so the first failed send gets a clear log line
  // ("EAUTH" / "535 5.7.8") at boot rather than buried in a request trace.
  transporter
    .verify()
    .then(() => {
      if (cached && cached.key === key) cached.verified = true;
      console.info(`[smtp] connection OK (${cfg.host}:${cfg.port} as ${cfg.user})`);
    })
    .catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(
        `[smtp] verify FAILED for ${cfg.host}:${cfg.port} as ${cfg.user} → ${msg}`
      );
    });

  return transporter;
}

export function getFromAddress(): string {
  const cfg = readSmtpConfig();
  if ("error" in cfg) return "";
  return cfg.from;
}

export type SendMailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

/**
 * Sends an HTML email via SMTP (e.g. Gmail).
 *
 * Required env vars:
 *   - SMTP_HOST          (e.g. smtp.gmail.com)
 *   - SMTP_PORT          (e.g. 587)
 *   - SMTP_SECURE        (true for 465, false for 587 — optional)
 *   - SMTP_USER          (full Gmail address)
 *   - SMTP_PASSWORD      (Gmail 16-char App Password)
 *   - SMTP_FROM_EMAIL    (display "Name <addr>" — must match SMTP_USER or a verified alias)
 */
/**
 * If `fromName` is provided we keep the authenticated email address (Gmail
 * requires `From` to match `SMTP_USER` or a verified alias) but rewrite the
 * display name. Useful when you want the recipient inbox to always show a
 * branded name like "Foodluk" regardless of `SMTP_FROM_EMAIL`.
 */
function buildFrom(cfg: SmtpConfig, fromName?: string): string {
  if (!fromName) return cfg.from;
  // Extract `addr` from `Name <addr>` or fall back to the raw value.
  const m = cfg.from.match(/<([^>]+)>/);
  const address = (m?.[1] ?? cfg.from).trim() || cfg.user;
  // Escape quotes inside the display name so the header stays valid.
  const safeName = fromName.replace(/"/g, "");
  return `"${safeName}" <${address}>`;
}

export async function sendMail(opts: {
  /** Single address, or many — many will share one SMTP message. */
  to: string | string[];
  subject: string;
  html: string;
  /** Plain-text fallback — strongly recommended; HTML-only mail is more often junked. */
  text?: string;
  replyTo?: string;
  /** Override display name (keeps the authenticated address). */
  fromName?: string;
  /** Override the whole From header (advanced). Must match SMTP_USER or alias. */
  from?: string;
}): Promise<SendMailResult> {
  const cfg = readSmtpConfig();
  if ("error" in cfg) return { ok: false, error: cfg.error };

  const recipients = Array.isArray(opts.to)
    ? opts.to.map((r) => r.trim()).filter(Boolean)
    : [opts.to.trim()].filter(Boolean);
  if (recipients.length === 0) {
    return { ok: false, error: "No recipient addresses." };
  }

  // Derive a plain-text fallback from HTML if the caller didn't supply one.
  // Spam filters (Gmail in particular) treat HTML-only messages more harshly.
  const text =
    opts.text ??
    opts.html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  try {
    const info = await getTransporter(cfg).sendMail({
      from: opts.from ?? buildFrom(cfg, opts.fromName),
      to: recipients,
      subject: opts.subject,
      html: opts.html,
      text,
      replyTo: opts.replyTo,
    });
    // Surface per-recipient outcome so a Gmail-side reject (e.g. invalid
    // mailbox, policy block) is visible in the dev terminal even though
    // nodemailer treats partial success as overall success.
    const accepted = (info.accepted ?? []) as Array<string | { address: string }>;
    const rejected = (info.rejected ?? []) as Array<string | { address: string }>;
    if (rejected.length > 0) {
      console.warn(
        `[smtp] partial reject id=${info.messageId} accepted=${JSON.stringify(
          accepted
        )} rejected=${JSON.stringify(rejected)} response=${info.response ?? ""}`
      );
    } else {
      console.info(
        `[smtp] sent id=${info.messageId} to=${recipients.join(",")} response=${
          info.response ?? ""
        }`
      );
    }
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "SMTP send failed (unknown error)";
    return { ok: false, error: msg };
  }
}
