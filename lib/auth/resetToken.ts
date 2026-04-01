import crypto from "crypto";

type ResetPayload = {
  email: string;
  exp: number; // epoch ms
};

const getResetSecret = () => {
  const secret =
    process.env.RESET_PASSWORD_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing RESET_PASSWORD_SECRET (or NEXTAUTH_SECRET)."
    );
  }

  // Dev fallback so the module works locally.
  return "dev-reset-password-secret";
};

const base64UrlEncode = (value: string) =>
  Buffer.from(value, "utf8").toString("base64url");

const base64UrlDecode = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

export function createResetToken(email: string) {
  const expMs = Date.now() + 1000 * 60 * 30; // 30 minutes
  const payload: ResetPayload = { email, exp: expMs };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(payloadStr);

  const secret = getResetSecret();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadStr)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

export function verifyResetToken(token: string) {
  const secret = getResetSecret();

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const payloadStr = base64UrlDecode(payloadB64);
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadStr)
    .digest("base64url");

  // Constant-ish time comparison.
  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSignature);
  if (sigA.length !== sigB.length) return null;
  if (!crypto.timingSafeEqual(sigA, sigB)) return null;

  let payload: ResetPayload;
  try {
    payload = JSON.parse(payloadStr) as ResetPayload;
  } catch {
    return null;
  }

  if (!payload?.email || typeof payload.exp !== "number") return null;
  if (payload.exp < Date.now()) return null;

  return payload;
}

