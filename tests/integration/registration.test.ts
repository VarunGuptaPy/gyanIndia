import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createRegistration, cancelPendingRegistration } from "@/server/registration";
import { ctx, registrationInput, resetDb } from "../support/factory";

let subjects: Awaited<ReturnType<typeof resetDb>>["subjects"];

beforeEach(async () => {
  ({ subjects } = await resetDb());
});

describe("student registration", () => {
  it("creates a guardian, student, consent record and pending registration with server-computed fees", async () => {
    const input = registrationInput([subjects[0].id, subjects[1].id, subjects[2].id]);
    const res = await createRegistration({ ...input, totalPaise: 100 }, null, ctx);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.newAccount).toBe(true);

    const reg = await db.registration.findUniqueOrThrow({
      where: { id: res.registrationId },
      include: { subjects: true, student: { include: { guardian: { include: { consents: true, user: true } } } } },
    });
    expect(reg.status).toBe("PENDING_PAYMENT");
    expect(reg.totalPaise).toBe(80000);
    expect(reg.registrationFeePaise).toBe(5000);
    expect(reg.subjects).toHaveLength(3);
    expect(reg.registrationNumber).toBeNull();
    expect(reg.student.guardian.consents).toHaveLength(1);
    expect(reg.student.guardian.user.role).toBe("GUARDIAN");
    expect(reg.student.guardian.user.passwordHash).not.toContain("TestPassword");
    expect(reg.student.guardian.mobile).toBe("+919876543210");
  });

  it("is idempotent for the same idempotency key", async () => {
    const input = registrationInput([subjects[0].id]);
    const a = await createRegistration(input, null, ctx);
    const b = await createRegistration(input, null, ctx);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(b.registrationId).toBe(a.registrationId);
    expect(await db.registration.count()).toBe(1);
  });

  it("handles concurrent duplicate submissions without creating two registrations", async () => {
    const input = registrationInput([subjects[0].id]);
    const results = await Promise.all([createRegistration(input, null, ctx), createRegistration(input, null, ctx)]);
    expect(await db.registration.count()).toBe(1);
    expect(results.some((r) => r.ok)).toBe(true);
  });

  it("prevents registering the same child twice under one guardian", async () => {
    const first = registrationInput([subjects[0].id]);
    const r1 = await createRegistration(first, null, ctx);
    expect(r1.ok).toBe(true);
    const user = await db.user.findUniqueOrThrow({ where: { email: (first.guardian as { email: string }).email } });
    const again = registrationInput([subjects[1].id], { guardian: first.guardian, password: undefined });
    (again.student as { fullName: string }).fullName = "  test   STUDENT ";
    const r2 = await createRegistration(again, { id: user.id, role: "GUARDIAN" }, ctx);
    expect(r2).toMatchObject({ ok: false, code: "DUPLICATE" });
  });

  it("allows a sibling to be registered from the same guardian account", async () => {
    const first = registrationInput([subjects[0].id]);
    await createRegistration(first, null, ctx);
    const user = await db.user.findUniqueOrThrow({ where: { email: (first.guardian as { email: string }).email } });
    const sibling = registrationInput([subjects[0].id], { password: undefined });
    (sibling.student as { fullName: string }).fullName = "Sibling Student";
    const r = await createRegistration(sibling, { id: user.id, role: "GUARDIAN" }, ctx);
    expect(r.ok).toBe(true);
    expect(await db.guardian.count()).toBe(1);
  });

  it("refuses when an account already exists for the email", async () => {
    const first = registrationInput([subjects[0].id]);
    await createRegistration(first, null, ctx);
    const r = await createRegistration(registrationInput([subjects[0].id], { guardian: first.guardian }), null, ctx);
    expect(r).toMatchObject({ ok: false, code: "ACCOUNT_EXISTS" });
  });

  it("requires guardian consent", async () => {
    const r = await createRegistration(registrationInput([subjects[0].id], { consent: { isGuardian: true, dataProcessing: false, terms: true } }), null, ctx);
    expect(r.ok).toBe(false);
    expect(await db.registration.count()).toBe(0);
  });

  it("rejects zero, duplicate and unavailable subjects", async () => {
    expect((await createRegistration(registrationInput([]), null, ctx)).ok).toBe(false);
    expect((await createRegistration(registrationInput([subjects[0].id, subjects[0].id]), null, ctx)).ok).toBe(false);
    await db.examSubject.update({ where: { id: subjects[6].id }, data: { isAvailable: false } });
    expect((await createRegistration(registrationInput([subjects[6].id]), null, ctx)).ok).toBe(false);
  });

  it("enforces the configured class range", async () => {
    await db.examination.updateMany({ data: { eligibleClassMax: 5 } });
    const r = await createRegistration(registrationInput([subjects[0].id]), null, ctx);
    expect(r).toMatchObject({ ok: false, fieldErrors: { "student.classGrade": expect.any(String) } });
  });

  it("refuses registrations when registration is closed", async () => {
    await db.examination.updateMany({ data: { registrationOpen: false } });
    const r = await createRegistration(registrationInput([subjects[0].id]), null, ctx);
    expect(r).toMatchObject({ ok: false, code: "CLOSED" });
  });

  it("refuses registrations from administrator accounts", async () => {
    const r = await createRegistration(registrationInput([subjects[0].id]), { id: "x", role: "SUPER_ADMIN" }, ctx);
    expect(r.ok).toBe(false);
  });

  it("lets a guardian cancel only their own unpaid registration", async () => {
    const input = registrationInput([subjects[0].id]);
    const r = await createRegistration(input, null, ctx);
    if (!r.ok) throw new Error("setup failed");
    const owner = await db.user.findUniqueOrThrow({ where: { email: (input.guardian as { email: string }).email } });
    expect((await cancelPendingRegistration(r.registrationId, "someone-else")).ok).toBe(false);
    expect((await cancelPendingRegistration(r.registrationId, owner.id)).ok).toBe(true);
    expect((await db.registration.findUniqueOrThrow({ where: { id: r.registrationId } })).status).toBe("CANCELLED");
  });
});
