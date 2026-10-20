import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createRegistration } from "@/server/registration";
import { confirmPayment } from "@/server/payments";
import {
  applyImportBatch, autoAllocateCentres, correctResult, createImportBatch, generateAdmitCards, generateRankings,
  issueCertificates, OpsError, previewRankings, releaseAdmitCards, revokeCertificate,
} from "@/server/exam-ops";
import { verifyCertificate } from "@/server/verification";
import { ctx, registrationInput, resetDb } from "../support/factory";

let exam: Awaited<ReturnType<typeof resetDb>>["exam"];
let subjects: Awaited<ReturnType<typeof resetDb>>["subjects"];
let admin: { id: string };

async function confirmedStudent(name: string, classGrade: number) {
  const input = registrationInput([subjects[0].id]);
  Object.assign(input.student as object, { fullName: name, classGrade });
  const r = await createRegistration(input, null, ctx);
  if (!r.ok) throw new Error(r.error);
  const reg = await db.registration.findUniqueOrThrow({ where: { id: r.registrationId } });
  const order = await db.paymentOrder.create({ data: { registrationId: reg.id, razorpayOrderId: `order_${randomUUID().slice(0, 10)}`, amountPaise: reg.totalPaise, receipt: randomUUID().slice(0, 12) } });
  await confirmPayment({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: `pay_${randomUUID().slice(0, 10)}`, amountPaise: reg.totalPaise, source: "WEBHOOK" });
  return db.registration.findUniqueOrThrow({ where: { id: reg.id } });
}

beforeEach(async () => {
  ({ exam, subjects } = await resetDb());
  admin = await db.user.create({ data: { email: "admin@test.local", name: "Admin", role: "SUPER_ADMIN", passwordHash: "x" } });
});

describe("centres and admit cards", () => {
  it("allocates by city and only generates cards for approved centres with a reporting time", async () => {
    const a = await confirmedStudent("Asha Verma", 6);
    await db.examinationCentre.create({ data: { examinationId: exam.id, code: "LKO-1", name: "Centre One", address: "Road 1", city: "Lucknow", state: "Uttar Pradesh", capacity: 10, isApproved: true } });
    expect(await autoAllocateCentres(exam.id, admin.id)).toEqual({ allocated: 1, unallocated: 0 });

    // No reporting time yet → skipped.
    expect(await generateAdmitCards(exam.id, admin.id)).toEqual({ generated: 0, skipped: 1 });
    await db.examination.update({ where: { id: exam.id }, data: { defaultReportingTime: "9:00 AM" } });
    expect(await generateAdmitCards(exam.id, admin.id)).toEqual({ generated: 1, skipped: 0 });

    await expect(releaseAdmitCards(exam.id, admin.id)).rejects.toBeInstanceOf(OpsError);
    await db.examination.update({ where: { id: exam.id }, data: { examDayInstructions: "Bring your admit card." } });
    expect(await releaseAdmitCards(exam.id, admin.id)).toEqual({ released: 1 });
    const card = await db.admitCard.findUniqueOrThrow({ where: { registrationId: a.id } });
    expect(card).toMatchObject({ status: "RELEASED", centreName: "Centre One", reportingTime: "9:00 AM" });
  });

  it("does not allocate to unapproved centres", async () => {
    await confirmedStudent("Asha Verma", 6);
    await db.examinationCentre.create({ data: { examinationId: exam.id, code: "LKO-2", name: "Pending", address: "x", city: "Lucknow", state: "Uttar Pradesh", capacity: 10 } });
    await expect(autoAllocateCentres(exam.id, admin.id)).rejects.toThrow(/approved centres/);
  });
});

describe("results, rankings and certificates", () => {
  it("runs the full import → rank → certificate → verify workflow", async () => {
    const a = await confirmedStudent("Asha Verma", 6);
    const b = await confirmedStudent("Bala Iyer", 6);
    const c = await confirmedStudent("Chirag Rao", 7);
    const csv = `registration_number,marks,status\n${a.registrationNumber},88\n${b.registrationNumber},88\n${c.registrationNumber},70\n`;

    const batch = await createImportBatch({ examSubjectId: subjects[0].id, fileName: "english.csv", csv, actorId: admin.id });
    expect((batch.errorRows as unknown[]).length).toBe(0);
    expect(await applyImportBatch(batch.id, admin.id)).toEqual({ applied: 3 });

    // Rankings require officially approved rules.
    await expect(previewRankings(exam.id, subjects[0].id)).rejects.toThrow(/approved/);
    await db.examination.update({ where: { id: exam.id }, data: { rankingScope: "SUBJECT_ONLY", tiePolicy: "SHARED_COMPETITION", rankingRulesApproved: true } });
    const preview = await previewRankings(exam.id, subjects[0].id);
    expect(preview.map((p) => p.rank)).toEqual([1, 1, 3]);

    await generateRankings(exam.id, admin.id);
    const rankings = await db.ranking.findMany({ orderBy: { rank: "asc" } });
    expect(rankings.map((r) => r.rank)).toEqual([1, 1, 3]);

    await expect(issueCertificates({ examinationId: exam.id, examSubjectId: subjects[0].id, type: "PARTICIPATION", actorId: admin.id })).rejects.toThrow(/Publish results/);
    await db.examination.update({ where: { id: exam.id }, data: { resultsPublished: true, rankingsPublished: true } });

    const rank = await issueCertificates({ examinationId: exam.id, examSubjectId: subjects[0].id, type: "NATIONAL_RANK", maxRank: 1, actorId: admin.id });
    expect(rank.issued).toBe(2);
    const again = await issueCertificates({ examinationId: exam.id, examSubjectId: subjects[0].id, type: "NATIONAL_RANK", maxRank: 1, actorId: admin.id });
    expect(again).toEqual({ issued: 0, alreadyIssued: 2 });

    const cert = await db.certificate.findFirstOrThrow({ where: { registrationId: a.id } });
    const v = await verifyCertificate(cert.certificateNumber.toLowerCase());
    expect(v).toMatchObject({ status: "valid", studentInitials: "A. V.", rank: 1, subjectName: "English" });
    expect(JSON.stringify(v)).not.toContain("Asha");

    await revokeCertificate(cert.id, "Issued in error", admin.id);
    expect((await verifyCertificate(cert.certificateNumber)).status).toBe("revoked");
    expect((await verifyCertificate("GYAN-C26-NOTREAL1")).status).toBe("not_found");
    expect((await verifyCertificate("rubbish")).status).toBe("invalid_format");
  });

  it("ranks within class when configured and rejects batches with errors", async () => {
    const a = await confirmedStudent("Asha Verma", 6);
    const c = await confirmedStudent("Chirag Rao", 7);
    const bad = await createImportBatch({ examSubjectId: subjects[0].id, fileName: "bad.csv", csv: `registration_number,marks\n${a.registrationNumber},150`, actorId: admin.id });
    await expect(applyImportBatch(bad.id, admin.id)).rejects.toThrow(/errors/);

    const ok = await createImportBatch({ examSubjectId: subjects[0].id, fileName: "ok.csv", csv: `registration_number,marks\n${a.registrationNumber},50\n${c.registrationNumber},40`, actorId: admin.id });
    await applyImportBatch(ok.id, admin.id);
    await db.examination.update({ where: { id: exam.id }, data: { rankingScope: "SUBJECT_AND_CLASS", tiePolicy: "SHARED_DENSE", rankingRulesApproved: true } });
    await generateRankings(exam.id, admin.id);
    const r = await db.ranking.findMany();
    expect(r.every((x) => x.rank === 1)).toBe(true);
    expect(r.map((x) => x.classGrade).sort()).toEqual([6, 7]);
  });

  it("logs result corrections with a reason", async () => {
    const a = await confirmedStudent("Asha Verma", 6);
    const batch = await createImportBatch({ examSubjectId: subjects[0].id, fileName: "x.csv", csv: `registration_number,marks\n${a.registrationNumber},50`, actorId: admin.id });
    await applyImportBatch(batch.id, admin.id);
    const result = await db.result.findFirstOrThrow();
    await expect(correctResult({ resultId: result.id, marks: "500", status: "PRESENT", reason: "Recount", actorId: admin.id })).rejects.toThrow(/exceed/);
    await correctResult({ resultId: result.id, marks: "55.5", status: "PRESENT", reason: "Re-evaluation", actorId: admin.id });
    const after = await db.result.findUniqueOrThrow({ where: { id: result.id }, include: { corrections: true } });
    expect(after.marksObtained?.toString()).toBe("55.5");
    expect(after.corrections[0]).toMatchObject({ reason: "Re-evaluation", correctedById: admin.id });
  });

  it("blocks bulk import once results are published", async () => {
    await db.examination.update({ where: { id: exam.id }, data: { resultsPublished: true } });
    await expect(createImportBatch({ examSubjectId: subjects[0].id, fileName: "x.csv", csv: "registration_number,marks", actorId: admin.id })).rejects.toThrow(/published/);
  });
});
