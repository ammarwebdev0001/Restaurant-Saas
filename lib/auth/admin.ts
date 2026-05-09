function normalizeEmailList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Emails allowed to access SaaS admin:
 * - `ADMIN_EMAILS` — comma-separated list
 * - `ADMIN_EMAIL` or `admin_email` — single address (aliases)
 * Also allow JWT/session `role === ADMIN` (platform admin).
 */
export function getAdminEmails(): string[] {
  const single =
    process.env.ADMIN_EMAIL?.trim() ??
    process.env.admin_email?.trim() ??
    "";
  const fromList = normalizeEmailList(process.env.ADMIN_EMAILS);
  const merged = [
    ...(single ? [single.toLowerCase()] : []),
    ...fromList,
  ];
  return [...new Set(merged)];
}

export function isPlatformAdmin(
  email: string | null | undefined,
  role: string | null | undefined
): boolean {
  if (role === "ADMIN") return true;
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * NextAuth JWT/session `role`: set to `ADMIN` when the user qualifies as platform admin
 * (`isPlatformAdmin`). Use after loading the account role from DB so env allowlists and
 * legacy `ADMIN` behave the same everywhere (`session.user.role`, headers, etc.).
 */
export function jwtRoleFromAccount(
  email: string | null | undefined,
  legacyRoleFromAccount: string | null | undefined
): string {
  const base =
    legacyRoleFromAccount != null && legacyRoleFromAccount !== ""
      ? legacyRoleFromAccount
      : "UNKNOW";
  return isPlatformAdmin(email, base) ? "ADMIN" : base;
}
