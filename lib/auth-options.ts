import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { z } from "zod";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

const ALLOWED_ROLES = ["OWNER", "WORKER", "UNKNOW", "ADMIN"] as const;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const providers = [
  CredentialsProvider({
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const user = await db.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (!user?.password) {
        console.warn("[auth][credentials] user not found or no password", {
          email: parsed.data.email,
        });
        return null;
      }

      const ok = await verifyPassword(parsed.data.password, user.password);
      if (!ok) {
        console.warn("[auth][credentials] invalid password", {
          email: parsed.data.email,
        });
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  }),
  ...(googleClientId && googleClientSecret
    ? [
        GoogleProvider({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }),
      ]
    : []),
];

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    async signIn(params: any) {
      const { user, account, profile } = params as {
        user: any;
        account: any;
        profile?: any;
      };
      if (account?.provider === "google") {
        const email = user.email ?? (profile as any)?.email;
        if (!email) return false;

        const existing = await db.user.findUnique({
          where: { email },
        });

        if (!existing) {
          const name =
            user.name ?? (profile as any)?.name ?? (profile as any)?.given_name;
          const picture = user.image ?? (profile as any)?.picture;

          const usernameBase =
            email
              .split("@")[0]
              .replace(/[^a-zA-Z0-9_]/g, "")
              .slice(0, 20) || "user";

          const username = `${usernameBase}_${Math.random()
            .toString(36)
            .slice(2, 6)}`;

          await db.user.create({
            data: {
              name: name || email,
              username,
              email,
              image: picture ?? null,
              role: "UNKNOW",
            },
          });
        }
      }

      return true;
    },

    async jwt(params: any) {
      const { token, user } = params as {
        token: any;
        user?: any;
        account?: any;
      };
      if (user) {
        const u = user as any;
        if (u.id) token.id = String(u.id);
        if (u.role && ALLOWED_ROLES.includes(u.role)) token.role = u.role;
        if (u.email) token.email = u.email;
      }

      if (!token.id || !token.role) {
        const email = token.email;
        if (email) {
          const existing = await db.user.findUnique({ where: { email } });
          if (existing) {
            token.id = existing.id;
            token.role = existing.role;
            token.name = existing.name;
            if (existing.email) token.email = existing.email;
          }
        }
      }

      if (token.id && !token.sub) token.sub = String(token.id);

      return token;
    },

    async session(params: any) {
      const { session, token } = params as { session: any; token: any };
      if (session.user) {
        if (token.id) session.user.id = String(token.id);
        if (token.role) session.user.role = String(token.role);
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = String(token.name);
      }
      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-nextauth-secret"),
  debug: process.env.NODE_ENV !== "production",
};
