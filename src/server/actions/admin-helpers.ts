import "server-only";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { assertPermission, AuthorizationError, type CurrentUser } from "@/lib/session";
import type { Permission } from "@/lib/rbac";
import { OpsError } from "@/server/exam-ops";

export type ActionResult = { ok: boolean; message: string };

/** Wraps an admin action: enforces the permission on the server and maps errors to messages. */
export async function adminAction(
  permission: Permission,
  fn: (user: CurrentUser) => Promise<string>,
): Promise<ActionResult> {
  try {
    const user = await assertPermission(permission);
    return { ok: true, message: await fn(user) };
  } catch (e) {
    if (e instanceof AuthorizationError) return { ok: false, message: e.message };
    if (e instanceof OpsError) return { ok: false, message: e.message };
    if (e instanceof ZodError) return { ok: false, message: e.issues[0]?.message ?? "Invalid input." };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "A record with these details already exists." };
    }
    console.error("[admin action] failed", e instanceof Error ? e.message : "unknown");
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

export function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
export function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v ? v : null;
}
export function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true";
}
export function optInt(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (!v) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new OpsError(`"${key}" must be a whole number.`);
  return n;
}
/** Parses a rupee amount like "250" or "250.50" into integer paise. */
export function rupeesToPaise(fd: FormData, key: string, required = true): number | null {
  const v = str(fd, key);
  if (!v) {
    if (required) throw new OpsError("Enter an amount.");
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(v)) throw new OpsError("Enter a valid rupee amount (up to 2 decimals).");
  const [w, f = ""] = v.split(".");
  return Number(w) * 100 + Number(f.padEnd(2, "0"));
}
