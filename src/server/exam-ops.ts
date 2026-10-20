import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { admitCardNumberFor, nextCounter } from "@/lib/counters";
import { randomCode } from "@/lib/signatures";
import { validateResultCsv, type ValidImportRow } from "@/lib/result-import";
import { computeRankings, type RankCandidate } from "@/lib/rankings";

export class OpsError extends Error {}

// ── Admit card instructions ─────────────────────────────────

/** Instructions come only from the administrator-approved text. */
export function admitCardInstructions(text: string | null): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*(\d+[.)]|[-*•])\s*/, "").trim())
    .filter(Boolean);
}

// ── Centre allocation ───────────────────────────────────────

export async function autoAllocateCentres(examinationId: string, actorId: string) {
  const centres = await db.examinationCentre.findMany({
    where: { examinationId, isApproved: true },
    include: { _count: { select: { allocations: true } } },
    orderBy: { code: "asc" },
  });
  if (!centres.length) throw new OpsError("There are no approved centres to allocate to.");
  const remaining = new Map(centres.map((c) => [c.id, c.capacity - c._count.allocations]));

  const pending = await db.registration.findMany({
    where: { examinationId, status: "CONFIRMED", allocation: null },
    include: { student: true },
    orderBy: { confirmedAt: "asc" },
  });

  const norm = (s: string) => s.trim().toLowerCase();
  const data: { registrationId: string; centreId: string }[] = [];
  for (const reg of pending) {
    const pick =
      centres.find((c) => norm(c.city) === norm(reg.student.city) && remaining.get(c.id)! > 0) ??
      centres.find((c) => norm(c.state) === norm(reg.student.state) && remaining.get(c.id)! > 0);
    if (!pick) continue;
    remaining.set(pick.id, remaining.get(pick.id)! - 1);
    data.push({ registrationId: reg.id, centreId: pick.id });
  }
  if (data.length) await db.centreAllocation.createMany({ data, skipDuplicates: true });
  await audit({ actorId, action: "centres.auto_allocated", entityType: "Examination", entityId: examinationId, metadata: { allocated: data.length, unallocated: pending.length - data.length } });
  return { allocated: data.length, unallocated: pending.length - data.length };
}

export async function allocateRegistration(registrationId: string, centreId: string, actorId: string) {
  const [reg, centre] = await Promise.all([
    db.registration.findUnique({ where: { id: registrationId }, include: { admitCard: true } }),
    db.examinationCentre.findUnique({ where: { id: centreId }, include: { _count: { select: { allocations: true } } } }),
  ]);
  if (!reg || reg.status !== "CONFIRMED") throw new OpsError("Only confirmed registrations can be allocated.");
  if (!centre || centre.examinationId !== reg.examinationId) throw new OpsError("Centre not found for this examination.");
  if (reg.admitCard?.status === "RELEASED") throw new OpsError("Revoke the released admit card before changing the centre.");
  if (centre._count.allocations >= centre.capacity) throw new OpsError("This centre is at full capacity.");
  await db.$transaction([
    db.admitCard.deleteMany({ where: { registrationId, status: "GENERATED" } }),
    db.centreAllocation.upsert({ where: { registrationId }, create: { registrationId, centreId }, update: { centreId } }),
  ]);
  await audit({ actorId, action: "centres.allocated", entityType: "Registration", entityId: registrationId, metadata: { centreId } });
}

// ── Admit cards ─────────────────────────────────────────────

export async function generateAdmitCards(examinationId: string, actorId: string) {
  const exam = await db.examination.findUniqueOrThrow({ where: { id: examinationId } });
  if (!exam.examDate) throw new OpsError("Set the examination date before generating admit cards.");

  const regs = await db.registration.findMany({
    where: { examinationId, status: "CONFIRMED", admitCard: null, allocation: { isNot: null } },
    include: { allocation: { include: { centre: true } } },
  });
  let generated = 0;
  let skipped = 0;
  for (const reg of regs) {
    const centre = reg.allocation!.centre;
    const reportingTime = centre.reportingTime ?? exam.defaultReportingTime;
    if (!centre.isApproved || !reportingTime) {
      skipped++;
      continue;
    }
    await db.$transaction(async (tx) => {
      const n = await nextCounter(tx, `admitcard:${examinationId}`);
      await tx.admitCard.create({
        data: {
          registrationId: reg.id,
          admitCardNumber: admitCardNumberFor(exam.year, n),
          verificationCode: randomCode(10),
          centreName: centre.name,
          centreAddress: `${centre.address}, ${centre.city}, ${centre.state}`,
          reportingTime,
        },
      });
    });
    generated++;
  }
  await audit({ actorId, action: "admitcards.generated", entityType: "Examination", entityId: examinationId, metadata: { generated, skipped } });
  return { generated, skipped };
}

export async function releaseAdmitCards(examinationId: string, actorId: string) {
  const exam = await db.examination.findUniqueOrThrow({ where: { id: examinationId } });
  if (!exam.examDayInstructions?.trim()) {
    throw new OpsError("Add the approved examination-day instructions (Settings) before releasing admit cards.");
  }
  const res = await db.$transaction(async (tx) => {
    const r = await tx.admitCard.updateMany({
      where: { status: "GENERATED", registration: { examinationId, status: "CONFIRMED" } },
      data: { status: "RELEASED", releasedAt: new Date() },
    });
    await tx.examination.update({ where: { id: examinationId }, data: { admitCardsReleased: true } });
    return r.count;
  });
  await audit({ actorId, action: "admitcards.released", entityType: "Examination", entityId: examinationId, metadata: { released: res } });
  return { released: res };
}

export async function revokeAdmitCard(admitCardId: string, actorId: string) {
  await db.admitCard.update({ where: { id: admitCardId }, data: { status: "REVOKED" } });
  await audit({ actorId, action: "admitcards.revoked", entityType: "AdmitCard", entityId: admitCardId });
}

/** Removes a revoked card so a fresh one (new number and code) can be generated. */
export async function deleteRevokedAdmitCard(admitCardId: string, actorId: string) {
  const card = await db.admitCard.findUnique({ where: { id: admitCardId } });
  if (!card || card.status !== "REVOKED") throw new OpsError("Only revoked admit cards can be reissued.");
  await db.admitCard.delete({ where: { id: admitCardId } });
  await audit({ actorId, action: "admitcards.reissue_prepared", entityType: "Registration", entityId: card.registrationId });
}

// ── Results import ──────────────────────────────────────────

async function enrolledMap(examSubjectId: string) {
  const rows = await db.registrationSubject.findMany({
    where: { examSubjectId, registration: { status: "CONFIRMED", registrationNumber: { not: null } } },
    select: { id: true, registration: { select: { registrationNumber: true } } },
  });
  return new Map(rows.map((r) => [r.registration.registrationNumber!, r.id]));
}

export async function createImportBatch(p: { examSubjectId: string; fileName: string; csv: string; actorId: string }) {
  const es = await db.examSubject.findUnique({ where: { id: p.examSubjectId }, include: { examination: true } });
  if (!es) throw new OpsError("Subject not found.");
  if (!es.maxMarks) throw new OpsError("Set the maximum marks for this subject (Subjects) before importing results.");
  if (es.examination.resultsPublished) {
    throw new OpsError("Results are already published. Use the correction workflow to change individual results.");
  }
  if (p.csv.length > 5_000_000) throw new OpsError("File is too large (maximum 5 MB).");

  const v = validateResultCsv(p.csv, es.maxMarks, await enrolledMap(es.id));
  const batch = await db.resultImportBatch.create({
    data: {
      examinationId: es.examinationId,
      examSubjectId: es.id,
      fileName: p.fileName.slice(0, 200),
      uploadedById: p.actorId,
      validRows: v.valid as unknown as Prisma.InputJsonValue,
      errorRows: v.errors as unknown as Prisma.InputJsonValue,
      rowCount: v.rowCount,
    },
  });
  await audit({ actorId: p.actorId, action: "results.import_uploaded", entityType: "ResultImportBatch", entityId: batch.id, metadata: { valid: v.valid.length, errors: v.errors.length } });
  return batch;
}

export async function applyImportBatch(batchId: string, actorId: string) {
  const batch = await db.resultImportBatch.findUnique({ where: { id: batchId }, include: { examSubject: true, examination: true } });
  if (!batch || batch.status !== "PENDING_REVIEW") throw new OpsError("This batch cannot be applied.");
  if (batch.examination.resultsPublished) throw new OpsError("Results are already published. Use corrections instead.");
  const errors = batch.errorRows as unknown as unknown[];
  if (errors.length) throw new OpsError("Fix all errors in the file and upload it again — batches with errors cannot be applied.");
  const rows = batch.validRows as unknown as ValidImportRow[];
  const maxMarks = batch.examSubject.maxMarks!;

  await db.$transaction(
    async (tx) => {
      for (const r of rows) {
        await tx.result.upsert({
          where: { registrationSubjectId: r.registrationSubjectId },
          create: { registrationSubjectId: r.registrationSubjectId, marksObtained: r.marks, maxMarks, status: r.status, batchId: batch.id },
          update: { marksObtained: r.marks, maxMarks, status: r.status, batchId: batch.id },
        });
      }
      await tx.resultImportBatch.update({ where: { id: batch.id }, data: { status: "APPLIED", appliedAt: new Date() } });
    },
    { timeout: 120_000 },
  );
  await audit({ actorId, action: "results.import_applied", entityType: "ResultImportBatch", entityId: batch.id, metadata: { rows: rows.length } });
  return { applied: rows.length };
}

export async function discardImportBatch(batchId: string, actorId: string) {
  const r = await db.resultImportBatch.updateMany({ where: { id: batchId, status: "PENDING_REVIEW" }, data: { status: "DISCARDED" } });
  if (r.count) await audit({ actorId, action: "results.import_discarded", entityType: "ResultImportBatch", entityId: batchId });
}

export async function correctResult(p: { resultId: string; marks: string | null; status: "PRESENT" | "ABSENT" | "WITHHELD"; reason: string; actorId: string }) {
  const result = await db.result.findUnique({ where: { id: p.resultId } });
  if (!result) throw new OpsError("Result not found.");
  if (p.reason.trim().length < 5) throw new OpsError("Give a reason for the correction.");
  if (p.status === "PRESENT") {
    if (!p.marks || !/^\d+(\.\d{1,2})?$/.test(p.marks)) throw new OpsError("Enter valid marks (up to 2 decimals).");
    if (Number(p.marks) > result.maxMarks) throw new OpsError(`Marks cannot exceed ${result.maxMarks}.`);
  }
  const newMarks = p.status === "PRESENT" ? p.marks : null;
  await db.$transaction([
    db.resultCorrection.create({
      data: {
        resultId: result.id,
        previousMarks: result.marksObtained,
        newMarks,
        previousStatus: result.status,
        newStatus: p.status,
        reason: p.reason.trim().slice(0, 500),
        correctedById: p.actorId,
      },
    }),
    db.result.update({ where: { id: result.id }, data: { marksObtained: newMarks, status: p.status } }),
  ]);
  await audit({ actorId: p.actorId, action: "results.corrected", entityType: "Result", entityId: result.id });
}

// ── Rankings ────────────────────────────────────────────────

async function rankingCandidates(examSubjectId: string): Promise<RankCandidate[]> {
  const rows = await db.result.findMany({
    where: {
      status: "PRESENT",
      marksObtained: { not: null },
      registrationSubject: { examSubjectId, registration: { status: "CONFIRMED" } },
    },
    include: { registrationSubject: { include: { registration: { include: { student: true } } } } },
  });
  return rows.map((r) => ({
    registrationSubjectId: r.registrationSubjectId,
    registrationNumber: r.registrationSubject.registration.registrationNumber!,
    classGrade: r.registrationSubject.registration.student.classGrade,
    marks: r.marksObtained!.toFixed(2),
  }));
}

function assertRankingRules(exam: { rankingScope: string | null; tiePolicy: string | null; rankingRulesApproved: boolean }) {
  if (!exam.rankingScope || !exam.tiePolicy || !exam.rankingRulesApproved) {
    throw new OpsError("Ranking scope and tie policy must be set and marked as officially approved (Settings) first.");
  }
}

export async function previewRankings(examinationId: string, examSubjectId: string) {
  const exam = await db.examination.findUniqueOrThrow({ where: { id: examinationId } });
  assertRankingRules(exam);
  return computeRankings(await rankingCandidates(examSubjectId), exam.rankingScope!, exam.tiePolicy!);
}

export async function generateRankings(examinationId: string, actorId: string) {
  const exam = await db.examination.findUniqueOrThrow({ where: { id: examinationId }, include: { subjects: true } });
  assertRankingRules(exam);
  if (exam.rankingsPublished) throw new OpsError("Unpublish rankings before recalculating them.");
  let total = 0;
  await db.$transaction(
    async (tx) => {
      await tx.ranking.deleteMany({ where: { examinationId } });
      for (const es of exam.subjects) {
        const ranked = computeRankings(await rankingCandidates(es.id), exam.rankingScope!, exam.tiePolicy!);
        if (ranked.length) {
          await tx.ranking.createMany({
            data: ranked.map((r) => ({
              examinationId,
              examSubjectId: es.id,
              classGrade: r.group,
              registrationSubjectId: r.registrationSubjectId,
              rank: r.rank,
              marks: r.marks,
            })),
          });
        }
        total += ranked.length;
      }
    },
    { timeout: 120_000 },
  );
  await audit({ actorId, action: "rankings.generated", entityType: "Examination", entityId: examinationId, metadata: { entries: total, scope: exam.rankingScope, tiePolicy: exam.tiePolicy } });
  return { entries: total };
}

/** True if any result changed after rankings were last generated. */
export async function rankingsStale(examinationId: string) {
  const latest = await db.ranking.findFirst({ where: { examinationId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  if (!latest) return false;
  const changed = await db.result.count({
    where: { updatedAt: { gt: latest.createdAt }, registrationSubject: { registration: { examinationId } } },
  });
  return changed > 0;
}

// ── Certificates ────────────────────────────────────────────

const ACHIEVEMENT = {
  PARTICIPATION: "has successfully participated",
  MERIT: "has demonstrated meritorious performance",
  NATIONAL_RANK: "has achieved outstanding distinction",
} as const;

export async function issueCertificates(p: {
  examinationId: string;
  examSubjectId: string;
  type: "PARTICIPATION" | "MERIT" | "NATIONAL_RANK";
  maxRank?: number;
  actorId: string;
}) {
  const exam = await db.examination.findUniqueOrThrow({ where: { id: p.examinationId } });
  if (!exam.resultsPublished) throw new OpsError("Publish results before issuing certificates.");
  if (p.type !== "PARTICIPATION") {
    if (!exam.rankingsPublished) throw new OpsError("Publish rankings before issuing rank-based certificates.");
    if (!p.maxRank || p.maxRank < 1) throw new OpsError("Enter the highest rank that qualifies.");
  }
  const es = await db.examSubject.findUniqueOrThrow({ where: { id: p.examSubjectId }, include: { subject: true } });

  const targets =
    p.type === "PARTICIPATION"
      ? await db.registrationSubject.findMany({
          where: { examSubjectId: es.id, result: { status: "PRESENT" }, registration: { status: "CONFIRMED" } },
          include: { registration: { include: { student: true } }, ranking: true },
        })
      : await db.registrationSubject.findMany({
          where: { examSubjectId: es.id, ranking: { rank: { lte: p.maxRank } }, registration: { status: "CONFIRMED" } },
          include: { registration: { include: { student: true } }, ranking: true },
        });

  const data = targets.map((t) => ({
    certificateNumber: `GYAN-C${String(exam.year).slice(-2)}-${randomCode(8)}`,
    registrationId: t.registrationId,
    registrationSubjectId: t.id,
    type: p.type,
    achievement: ACHIEVEMENT[p.type],
    subjectName: es.subject.name,
    rank: p.type === "PARTICIPATION" ? null : (t.ranking?.rank ?? null),
    examName: exam.name,
    examYear: exam.year,
    studentName: t.registration.student.fullName,
    issuedById: p.actorId,
  }));
  const created = data.length ? (await db.certificate.createMany({ data, skipDuplicates: true })).count : 0;
  await audit({ actorId: p.actorId, action: "certificates.issued", entityType: "ExamSubject", entityId: es.id, metadata: { type: p.type, issued: created, maxRank: p.maxRank ?? null } });
  return { issued: created, alreadyIssued: data.length - created };
}

export async function revokeCertificate(id: string, reason: string, actorId: string) {
  if (reason.trim().length < 5) throw new OpsError("Give a reason for revoking.");
  const r = await db.certificate.updateMany({
    where: { id, status: "ISSUED" },
    data: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason.trim().slice(0, 300) },
  });
  if (!r.count) throw new OpsError("Certificate not found or already revoked.");
  await audit({ actorId, action: "certificates.revoked", entityType: "Certificate", entityId: id });
}
