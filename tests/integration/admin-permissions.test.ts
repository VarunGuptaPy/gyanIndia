import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { resetDb } from "../support/factory";

const session = vi.hoisted(() => ({ current: null as null | { user: { id: string; role: string } } }));
vi.mock("next-auth", () => ({ getServerSession: async () => session.current }));

const { setRegistrationOpen, updateExamSubject, refundPaymentAction, createStaffUser, setResultsPublished } = await import("@/server/actions/admin");
const { GET: exportStudents } = await import("@/app/api/admin/export/students/route");

let exam: Awaited<ReturnType<typeof resetDb>>["exam"];
let subjects: Awaited<ReturnType<typeof resetDb>>["subjects"];

async function signInAs(role: string, active = true) {
  const u = await db.user.create({ data: { email: `${role.toLowerCase()}-${Math.random()}@t.local`, name: "Staff Member", role: role as "GUARDIAN", passwordHash: "x", isActive: active } });
  session.current = { user: { id: u.id, role } };
  return u;
}

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

beforeEach(async () => {
  ({ exam, subjects } = await resetDb());
  session.current = null;
});

describe("admin permissions are enforced on the server", () => {
  it("rejects anonymous users", async () => {
    const r = await setRegistrationOpen(fd({ id: exam.id, open: "false" }));
    expect(r.ok).toBe(false);
    expect((await db.examination.findUniqueOrThrow({ where: { id: exam.id } })).registrationOpen).toBe(true);
  });

  it("rejects guardians", async () => {
    await signInAs("GUARDIAN");
    expect((await setRegistrationOpen(fd({ id: exam.id, open: "false" }))).ok).toBe(false);
  });

  it("rejects a finance admin changing subjects, and an exam admin issuing refunds", async () => {
    await signInAs("FINANCE_ADMIN");
    expect((await updateExamSubject(fd({ id: subjects[0].id, fee: "1" }))).ok).toBe(false);
    expect((await db.examSubject.findUniqueOrThrow({ where: { id: subjects[0].id } })).feePaise).toBe(25000);
    await signInAs("EXAM_ADMIN");
    expect((await refundPaymentAction(fd({ paymentId: "x", amount: "1", reason: "test reason" }))).ok).toBe(false);
  });

  it("only super admins can create staff accounts", async () => {
    await signInAs("EXAM_ADMIN");
    const r = await createStaffUser(fd({ name: "New Person", email: "new@t.local", role: "SUPER_ADMIN", password: "a-very-long-password" }));
    expect(r.ok).toBe(false);
    expect(await db.user.count({ where: { email: "new@t.local" } })).toBe(0);
  });

  it("treats deactivated accounts as signed out", async () => {
    await signInAs("SUPER_ADMIN", false);
    expect((await setRegistrationOpen(fd({ id: exam.id, open: "false" }))).ok).toBe(false);
  });

  it("allows permitted actions and records them in the audit log", async () => {
    const u = await signInAs("EXAM_ADMIN");
    const r = await updateExamSubject(fd({ id: subjects[0].id, fee: "300", isAvailable: "on", maxMarks: "50" }));
    expect(r.ok).toBe(true);
    expect(await db.examSubject.findUniqueOrThrow({ where: { id: subjects[0].id } })).toMatchObject({ feePaise: 30000, maxMarks: 50 });
    expect(await db.auditLog.count({ where: { actorId: u.id, action: "subject.updated" } })).toBe(1);
  });

  it("refuses to publish results when none exist", async () => {
    await signInAs("SUPER_ADMIN");
    const r = await setResultsPublished(fd({ examinationId: exam.id, publish: "true" }));
    expect(r).toEqual({ ok: false, message: "There are no results to publish." });
  });

  it("restricts student exports to permitted roles", async () => {
    await signInAs("SCHOOL_COORDINATOR");
    expect((await exportStudents(new Request("http://localhost/api/admin/export/students"))).status).toBe(403);
    await signInAs("SUPER_ADMIN");
    const res = await exportStudents(new Request("http://localhost/api/admin/export/students"));
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/^registration_number,status,student_name/);
  });
});
