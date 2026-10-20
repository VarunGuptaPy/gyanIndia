"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashIp, userAgent } from "@/lib/request";
import { cancelPendingRegistration, createRegistration, type RegistrationActionResult } from "@/server/registration";

export async function createRegistrationAction(values: unknown): Promise<RegistrationActionResult> {
  const ipHash = hashIp(await clientIp());
  if (!(await rateLimit(`register:${ipHash}`, 15, 60 * 60))) {
    return { ok: false, error: "Too many registration attempts from this connection. Please try again later." };
  }
  const user = await currentUser();
  return createRegistration(values, user ? { id: user.id, role: user.role } : null, {
    ipHash,
    userAgent: await userAgent(),
  });
}

export async function cancelRegistrationAction(registrationId: string) {
  const user = await currentUser();
  if (!user || user.role !== "GUARDIAN") return { ok: false as const, error: "Please log in." };
  const res = await cancelPendingRegistration(registrationId, user.id);
  revalidatePath("/student/dashboard");
  return res;
}
