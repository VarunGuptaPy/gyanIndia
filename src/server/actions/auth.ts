"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { emailConfigured, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashIp } from "@/lib/request";
import { randomToken, sha256Hex } from "@/lib/signatures";
import { SITE } from "@/lib/site";
import { fieldErrors, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation";

export async function requestPasswordReset(raw: unknown) {
  const ipHash = hashIp(await clientIp());
  if (!(await rateLimit(`pwreset:${ipHash}`, 5, 60 * 30))) {
    return { ok: false as const, error: "Too many requests. Please try again later." };
  }
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid email address." };
  const enabled = emailConfigured();
  if (!enabled) return { ok: true as const, emailEnabled: false };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Respond identically whether or not the account exists.
  if (user && user.isActive) {
    const token = randomToken(32);
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha256Hex(token), expiresAt: new Date(Date.now() + 30 * 60_000) },
    });
    await sendEmail({
      to: user.email,
      subject: "Reset your GYAN password",
      text: `Hello ${user.name},\n\nWe received a request to reset your GYAN account password. Use the link below within 30 minutes:\n\n${SITE.url}/reset-password?token=${token}\n\nIf you did not request this, you can ignore this email.\n\nTeam GYAN`,
    });
    await audit({ actorId: user.id, action: "auth.password_reset_requested", entityType: "User", entityId: user.id, ipHash });
  }
  return { ok: true as const, emailEnabled: true };
}

export async function resetPassword(raw: unknown) {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256Hex(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false as const, error: "This reset link has expired or already been used. Please request a new one." };
  }
  const hash = await bcrypt.hash(parsed.data.password, 12);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: hash, failedLoginCount: 0, lockedUntil: null } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);
  await audit({ actorId: record.userId, action: "auth.password_reset_completed", entityType: "User", entityId: record.userId });
  return { ok: true as const };
}
