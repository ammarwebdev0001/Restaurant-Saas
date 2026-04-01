/** Emails allowed to access SaaS admin (comma-separated in ADMIN_EMAILS). Also allow User.role === ADMIN. */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(
  email: string | null | undefined,
  role: string | null | undefined
): boolean {
  if (role === "ADMIN") return true;
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
