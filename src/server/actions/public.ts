"use server";

import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashIp } from "@/lib/request";
import { enquirySchema, fieldErrors, schoolPartnershipSchema } from "@/lib/validation";

export type FormResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitEnquiry(raw: unknown): Promise<FormResult> {
  const ipHash = hashIp(await clientIp());
  if (!(await rateLimit(`enquiry:${ipHash}`, 5, 60 * 60))) {
    return { ok: false, error: "Too many messages from this connection. Please try again later." };
  }
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  const { website, name, email, phone, category, message } = parsed.data;
  // Honeypot filled → silently accept without storing.
  if (website) return { ok: true };
  const enquiry = await db.enquiry.create({ data: { name, email, phone: phone || null, category, message } });
  await audit({ action: "enquiry.created", entityType: "Enquiry", entityId: enquiry.id, ipHash });
  return { ok: true };
}

export async function submitSchoolPartnership(raw: unknown): Promise<FormResult> {
  const ipHash = hashIp(await clientIp());
  if (!(await rateLimit(`school:${ipHash}`, 5, 60 * 60))) {
    return { ok: false, error: "Too many submissions from this connection. Please try again later." };
  }
  const parsed = schoolPartnershipSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { website, consent, ...data } = parsed.data;
  if (website) return { ok: true };
  const p = await db.schoolPartnership.create({
    data: { ...data, contactRole: data.contactRole || null, message: data.message || null },
  });
  await audit({ action: "school_partnership.created", entityType: "SchoolPartnership", entityId: p.id, ipHash });
  return { ok: true };
}
