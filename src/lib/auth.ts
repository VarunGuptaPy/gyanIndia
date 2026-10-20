import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { loginSchema } from "./validation";
import { rateLimit } from "./rate-limit";
import { audit } from "./audit";
import { hashIp } from "./request";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

let _dummy: string | undefined;
const dummyHash = () => (_dummy ??= bcrypt.hashSync("timing-equaliser-not-a-password", 12));

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 hours
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const fwd = req?.headers?.["x-forwarded-for"];
        const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim() || "unknown";
        const ipHash = hashIp(ip);
        if (!(await rateLimit(`login:ip:${ipHash}`, 20, 15 * 60))) return null;
        if (!(await rateLimit(`login:email:${email}`, 10, 15 * 60))) return null;

        const user = await db.user.findUnique({ where: { email } });
        // Compare against a dummy hash when the user is missing to keep timing similar.
        const hash = user?.passwordHash ?? dummyHash();
        const ok = await bcrypt.compare(password, hash);

        if (!user || !user.isActive) return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        if (!ok) {
          const failed = user.failedLoginCount + 1;
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: failed >= MAX_FAILED_LOGINS ? 0 : failed,
              lockedUntil: failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
            },
          });
          if (failed >= MAX_FAILED_LOGINS) {
            await audit({ actorId: user.id, action: "auth.locked", entityType: "User", entityId: user.id, ipHash });
          }
          return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        if (user.role !== "GUARDIAN") {
          await audit({ actorId: user.id, action: "auth.admin_login", entityType: "User", entityId: user.id, ipHash });
        }
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
