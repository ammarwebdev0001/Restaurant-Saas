import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      roleName?: string | null;
      /** True when email is in `ADMIN_EMAIL` / `ADMIN_EMAILS` (set server-side). */
      isPlatformAdmin?: boolean;
      /** `User.roleId` — null means no account role assigned yet. */
      roleId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    roleName?: string | null;
    platformAdmin?: boolean;
    roleId?: string | null;
  }
}

