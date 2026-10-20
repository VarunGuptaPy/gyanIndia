import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import { authOptions } from "./auth";
import { db } from "./db";
import { can, isAdminRole, type Permission } from "./rbac";

/**
 * Returns the signed-in user re-validated against the database, so a deactivated
 * account or a changed role takes effect immediately rather than at token expiry.
 */
export const currentUser = cache(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function requireGuardian(callbackUrl = "/student/dashboard") {
  const user = await currentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (user.role !== "GUARDIAN") redirect("/admin");
  const guardian = await db.guardian.findUnique({ where: { userId: user.id } });
  if (!guardian) redirect("/register");
  return { user, guardian };
}

export async function requireAdmin(permission: Permission = "dashboard:view") {
  const user = await currentUser();
  if (!user) redirect(`/login?callbackUrl=/admin`);
  if (!isAdminRole(user.role)) redirect("/student/dashboard");
  if (!can(user.role, permission)) redirect("/admin?denied=1");
  return user;
}

export class AuthorizationError extends Error {
  constructor(message = "You are not authorised to perform this action.") {
    super(message);
  }
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function assertPermission(permission: Permission) {
  const user = await currentUser();
  if (!user || !can(user.role, permission)) throw new AuthorizationError();
  return user;
}
