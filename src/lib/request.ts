import { headers } from "next/headers";
import { sha256Hex } from "./signatures";

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export function ipFromRequest(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** IPs are stored only as salted hashes. */
export function hashIp(ip: string): string {
  return sha256Hex(`${process.env.NEXTAUTH_SECRET ?? ""}:${ip}`).slice(0, 32);
}

export async function userAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent")?.slice(0, 250) ?? null;
}
