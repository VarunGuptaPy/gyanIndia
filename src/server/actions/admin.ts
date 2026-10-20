"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { razorpay, razorpayConfig } from "@/lib/razorpay";
import { ROLES } from "@/lib/rbac";
import { email as emailSchema, personName, stateSchema } from "@/lib/validation";
import {
  allocateRegistration,
  applyImportBatch,
  autoAllocateCentres,
  correctResult,
  createImportBatch,
  deleteRevokedAdmitCard,
  discardImportBatch,
  generateAdmitCards,
  generateRankings,
  issueCertificates,
  OpsError,
  releaseAdmitCards,
  revokeAdmitCard,
  revokeCertificate,
} from "@/server/exam-ops";
import { adminAction, bool, optInt, optStr, rupeesToPaise, str, type ActionResult } from "./admin-helpers";

const dateFromInput = (v: string | null) => (v ? new Date(`${v}T00:00:00+05:30`) : null);

// ── Examination ─────────────────────────────────────────────

export async function updateExamination(fd: FormData): Promise<ActionResult> {
  return adminAction("exams:manage", async (user) => {
    const id = str(fd, "id");
    const languages = fd.getAll("languages").map(String).filter((l) => l === "English" || l === "Hindi");
    if (!languages.length) throw new OpsError("Select at least one examination language.");
    const boards = str(fd, "boards").split(",").map((b) => b.trim()).filter(Boolean);
    if (!boards.length) throw new OpsError("Enter at least one board.");
    const min = optInt(fd, "eligibleClassMin") ?? 1;
    const max = optInt(fd, "eligibleClassMax") ?? 10;
    if (min < 1 || max > 12 || min > max) throw new OpsError("Enter a valid class range (1–12).");
    const scope = optStr(fd, "rankingScope");
    const tie = optStr(fd, "tiePolicy");
    if (scope && !["SUBJECT_AND_CLASS", "SUBJECT_ONLY"].includes(scope)) throw new OpsError("Invalid ranking scope.");
    if (tie && !["SHARED_COMPETITION", "SHARED_DENSE"].includes(tie)) throw new OpsError("Invalid tie policy.");
    const rulesApproved = bool(fd, "rankingRulesApproved");
    if (rulesApproved && (!scope || !tie)) throw new OpsError("Choose a ranking scope and tie policy before marking the rules approved.");

    const exam = await db.examination.findUniqueOrThrow({ where: { id } });
    if (exam.rankingsPublished && (scope !== exam.rankingScope || tie !== exam.tiePolicy)) {
      throw new OpsError("Unpublish rankings before changing ranking rules.");
    }

    await db.examination.update({
      where: { id },
      data: {
        name: str(fd, "name") || exam.name,
        examDate: dateFromInput(optStr(fd, "examDate")),
        mode: str(fd, "mode") || "Offline",
        languages,
        registrationFeePaise: rupeesToPaise(fd, "registrationFee")!,
        eligibleClassMin: min,
        eligibleClassMax: max,
        eligibilityApproved: bool(fd, "eligibilityApproved"),
        boards,
        boardsApproved: bool(fd, "boardsApproved"),
        durationMinutes: optInt(fd, "durationMinutes"),
        questionCount: optInt(fd, "questionCount"),
        markingScheme: optStr(fd, "markingScheme"),
        negativeMarking: optStr(fd, "negativeMarking"),
        registrationDeadline: dateFromInput(optStr(fd, "registrationDeadline")),
        resultDate: dateFromInput(optStr(fd, "resultDate")),
        defaultReportingTime: optStr(fd, "defaultReportingTime"),
        examDayInstructions: optStr(fd, "examDayInstructions"),
        rankingScope: (scope as "SUBJECT_AND_CLASS" | "SUBJECT_ONLY" | null) ?? null,
        tiePolicy: (tie as "SHARED_COMPETITION" | "SHARED_DENSE" | null) ?? null,
        rankingRulesApproved: rulesApproved,
      },
    });
    await audit({ actorId: user.id, action: "exam.updated", entityType: "Examination", entityId: id });
    revalidatePath("/", "layout");
    return "Examination settings saved.";
  });
}

export async function setRegistrationOpen(fd: FormData): Promise<ActionResult> {
  return adminAction("exams:manage", async (user) => {
    const id = str(fd, "id");
    const open = str(fd, "open") === "true";
    await db.examination.update({ where: { id }, data: { registrationOpen: open } });
    await audit({ actorId: user.id, action: open ? "exam.registration_opened" : "exam.registration_closed", entityType: "Examination", entityId: id });
    revalidatePath("/", "layout");
    return open ? "Registration is now open." : "Registration is now closed.";
  });
}

// ── Subjects ────────────────────────────────────────────────

export async function updateExamSubject(fd: FormData): Promise<ActionResult> {
  return adminAction("subjects:manage", async (user) => {
    const id = str(fd, "id");
    const es = await db.examSubject.findUniqueOrThrow({ where: { id }, include: { examination: true } });
    const maxMarks = optInt(fd, "maxMarks");
    if (maxMarks !== null && maxMarks < 1) throw new OpsError("Maximum marks must be at least 1.");
    if (es.examination.resultsPublished && maxMarks !== es.maxMarks) throw new OpsError("Maximum marks cannot change after results are published.");
    const feePaise = rupeesToPaise(fd, "fee")!;
    await db.examSubject.update({
      where: { id },
      data: { feePaise, isAvailable: bool(fd, "isAvailable"), isApproved: bool(fd, "isApproved"), maxMarks },
    });
    await audit({ actorId: user.id, action: "subject.updated", entityType: "ExamSubject", entityId: id, metadata: { feePaise, maxMarks } });
    revalidatePath("/", "layout");
    return "Subject updated. New fees apply to new registrations only.";
  });
}

// ── Awards ──────────────────────────────────────────────────

export async function saveAwardCategory(fd: FormData): Promise<ActionResult> {
  return adminAction("awards:manage", async (user) => {
    const id = optStr(fd, "id");
    const rankFrom = optInt(fd, "rankFrom");
    const rankTo = optInt(fd, "rankTo");
    if (!rankFrom || !rankTo || rankFrom > rankTo) throw new OpsError("Enter a valid rank range.");
    const title = str(fd, "title");
    if (title.length < 3) throw new OpsError("Enter a title.");
    const data = {
      title,
      rankFrom,
      rankTo,
      description: optStr(fd, "description"),
      cashPrizePaise: rupeesToPaise(fd, "cashPrize", false),
      includesTrophy: bool(fd, "includesTrophy"),
      includesMedal: bool(fd, "includesMedal"),
      includesCertificate: bool(fd, "includesCertificate"),
      isConfirmed: bool(fd, "isConfirmed"),
      sortOrder: optInt(fd, "sortOrder") ?? 0,
    };
    const rec = id
      ? await db.awardCategory.update({ where: { id }, data })
      : await db.awardCategory.create({ data: { ...data, examinationId: str(fd, "examinationId") } });
    await audit({ actorId: user.id, action: id ? "award.updated" : "award.created", entityType: "AwardCategory", entityId: rec.id, metadata: { isConfirmed: data.isConfirmed, cashPrizePaise: data.cashPrizePaise } });
    revalidatePath("/", "layout");
    return "Award category saved.";
  });
}

export async function deleteAwardCategory(fd: FormData): Promise<ActionResult> {
  return adminAction("awards:manage", async (user) => {
    const id = str(fd, "id");
    await db.awardCategory.delete({ where: { id } });
    await audit({ actorId: user.id, action: "award.deleted", entityType: "AwardCategory", entityId: id });
    revalidatePath("/", "layout");
    return "Award category removed.";
  });
}

// ── Centres ─────────────────────────────────────────────────

const centreSchema = z.object({
  code: z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9-]+$/, "Centre code may contain letters, numbers and hyphens."),
  name: z.string().trim().min(3).max(150),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  state: stateSchema,
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1.").max(100000),
  reportingTime: z.string().trim().max(60).optional(),
});

export async function saveCentre(fd: FormData): Promise<ActionResult> {
  return adminAction("centres:manage", async (user) => {
    const id = optStr(fd, "id");
    const parsed = centreSchema.parse(Object.fromEntries(fd));
    const data = { ...parsed, code: parsed.code.toUpperCase(), reportingTime: parsed.reportingTime || null, isApproved: bool(fd, "isApproved") };
    if (id) {
      const existing = await db.examinationCentre.findUniqueOrThrow({ where: { id }, include: { _count: { select: { allocations: true } } } });
      if (data.capacity < existing._count.allocations) throw new OpsError(`Capacity cannot be below the ${existing._count.allocations} students already allocated.`);
      await db.examinationCentre.update({ where: { id }, data });
    } else {
      await db.examinationCentre.create({ data: { ...data, examinationId: str(fd, "examinationId") } });
    }
    await audit({ actorId: user.id, action: id ? "centre.updated" : "centre.created", entityType: "ExaminationCentre", entityId: id, metadata: { code: data.code, isApproved: data.isApproved } });
    revalidatePath("/admin/centres");
    return "Centre saved. Admit cards already generated keep their original centre details.";
  });
}

export async function autoAllocateAction(fd: FormData): Promise<ActionResult> {
  return adminAction("centres:manage", async (user) => {
    const r = await autoAllocateCentres(str(fd, "examinationId"), user.id);
    revalidatePath("/admin/centres");
    return `Allocated ${r.allocated} registration(s). ${r.unallocated} could not be matched to a centre with capacity.`;
  });
}

export async function allocateAction(fd: FormData): Promise<ActionResult> {
  return adminAction("centres:manage", async (user) => {
    await allocateRegistration(str(fd, "registrationId"), str(fd, "centreId"), user.id);
    revalidatePath("/admin/registrations");
    return "Centre allocated.";
  });
}

// ── Admit cards ─────────────────────────────────────────────

export async function generateAdmitCardsAction(fd: FormData): Promise<ActionResult> {
  return adminAction("admitcards:manage", async (user) => {
    const r = await generateAdmitCards(str(fd, "examinationId"), user.id);
    revalidatePath("/admin/admit-cards");
    return `Generated ${r.generated} admit card(s).${r.skipped ? ` ${r.skipped} skipped (centre not approved or reporting time missing).` : ""}`;
  });
}

export async function releaseAdmitCardsAction(fd: FormData): Promise<ActionResult> {
  return adminAction("admitcards:manage", async (user) => {
    const r = await releaseAdmitCards(str(fd, "examinationId"), user.id);
    revalidatePath("/admin/admit-cards");
    return `Released ${r.released} admit card(s) to guardians.`;
  });
}

export async function revokeAdmitCardAction(fd: FormData): Promise<ActionResult> {
  return adminAction("admitcards:manage", async (user) => {
    await revokeAdmitCard(str(fd, "id"), user.id);
    revalidatePath("/admin/admit-cards");
    return "Admit card revoked.";
  });
}

export async function reissueAdmitCardAction(fd: FormData): Promise<ActionResult> {
  return adminAction("admitcards:manage", async (user) => {
    await deleteRevokedAdmitCard(str(fd, "id"), user.id);
    revalidatePath("/admin/admit-cards");
    return "Revoked card cleared. Generate admit cards to issue a new one.";
  });
}

// ── Results ─────────────────────────────────────────────────

export async function uploadResultsAction(fd: FormData): Promise<ActionResult> {
  return adminAction("results:manage", async (user) => {
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) throw new OpsError("Choose a CSV file.");
    if (!/\.csv$/i.test(file.name)) throw new OpsError("Only .csv files are accepted.");
    const batch = await createImportBatch({ examSubjectId: str(fd, "examSubjectId"), fileName: file.name, csv: await file.text(), actorId: user.id });
    revalidatePath("/admin/results");
    return `Uploaded. Review batch ${batch.id.slice(-6)} below before applying.`;
  });
}

export async function applyBatchAction(fd: FormData): Promise<ActionResult> {
  return adminAction("results:manage", async (user) => {
    const r = await applyImportBatch(str(fd, "batchId"), user.id);
    revalidatePath("/admin/results");
    return `Applied ${r.applied} result(s).`;
  });
}

export async function discardBatchAction(fd: FormData): Promise<ActionResult> {
  return adminAction("results:manage", async (user) => {
    await discardImportBatch(str(fd, "batchId"), user.id);
    revalidatePath("/admin/results");
    return "Batch discarded.";
  });
}

export async function correctResultAction(fd: FormData): Promise<ActionResult> {
  return adminAction("results:manage", async (user) => {
    const status = str(fd, "status") as "PRESENT" | "ABSENT" | "WITHHELD";
    if (!["PRESENT", "ABSENT", "WITHHELD"].includes(status)) throw new OpsError("Invalid status.");
    await correctResult({ resultId: str(fd, "resultId"), marks: optStr(fd, "marks"), status, reason: str(fd, "reason"), actorId: user.id });
    revalidatePath("/admin/results");
    return "Result corrected and logged. Recalculate rankings if they were already generated.";
  });
}

export async function setResultsPublished(fd: FormData): Promise<ActionResult> {
  return adminAction("results:publish", async (user) => {
    const id = str(fd, "examinationId");
    const publish = str(fd, "publish") === "true";
    if (publish) {
      const count = await db.result.count({ where: { registrationSubject: { registration: { examinationId: id } } } });
      if (!count) throw new OpsError("There are no results to publish.");
    } else {
      const exam = await db.examination.findUniqueOrThrow({ where: { id } });
      if (exam.rankingsPublished) throw new OpsError("Unpublish rankings first.");
    }
    await db.examination.update({ where: { id }, data: { resultsPublished: publish } });
    await audit({ actorId: user.id, action: publish ? "results.published" : "results.unpublished", entityType: "Examination", entityId: id });
    revalidatePath("/", "layout");
    return publish ? "Results published to guardians." : "Results unpublished.";
  });
}

// ── Rankings ────────────────────────────────────────────────

export async function generateRankingsAction(fd: FormData): Promise<ActionResult> {
  return adminAction("rankings:manage", async (user) => {
    const r = await generateRankings(str(fd, "examinationId"), user.id);
    revalidatePath("/admin/rankings");
    return `Rankings calculated (${r.entries} entries). Review before publishing.`;
  });
}

export async function setRankingsPublished(fd: FormData): Promise<ActionResult> {
  return adminAction("rankings:manage", async (user) => {
    const id = str(fd, "examinationId");
    const publish = str(fd, "publish") === "true";
    const exam = await db.examination.findUniqueOrThrow({ where: { id } });
    if (publish) {
      if (!exam.resultsPublished) throw new OpsError("Publish results before rankings.");
      if (!exam.rankingRulesApproved) throw new OpsError("Ranking rules are not approved.");
      if (!(await db.ranking.count({ where: { examinationId: id } }))) throw new OpsError("Calculate rankings first.");
    }
    await db.examination.update({ where: { id }, data: { rankingsPublished: publish } });
    await audit({ actorId: user.id, action: publish ? "rankings.published" : "rankings.unpublished", entityType: "Examination", entityId: id });
    revalidatePath("/", "layout");
    return publish ? "Rankings published." : "Rankings unpublished.";
  });
}

// ── Certificates ────────────────────────────────────────────

export async function issueCertificatesAction(fd: FormData): Promise<ActionResult> {
  return adminAction("certificates:manage", async (user) => {
    const type = str(fd, "type") as "PARTICIPATION" | "MERIT" | "NATIONAL_RANK";
    if (!["PARTICIPATION", "MERIT", "NATIONAL_RANK"].includes(type)) throw new OpsError("Choose a certificate type.");
    const r = await issueCertificates({
      examinationId: str(fd, "examinationId"),
      examSubjectId: str(fd, "examSubjectId"),
      type,
      maxRank: optInt(fd, "maxRank") ?? undefined,
      actorId: user.id,
    });
    revalidatePath("/admin/certificates");
    return `Issued ${r.issued} certificate(s).${r.alreadyIssued ? ` ${r.alreadyIssued} already had this certificate.` : ""}`;
  });
}

export async function revokeCertificateAction(fd: FormData): Promise<ActionResult> {
  return adminAction("certificates:manage", async (user) => {
    await revokeCertificate(str(fd, "id"), str(fd, "reason"), user.id);
    revalidatePath("/admin/certificates");
    return "Certificate revoked. Verification will now show it as revoked.";
  });
}

// ── Schools ─────────────────────────────────────────────────

export async function updatePartnership(fd: FormData): Promise<ActionResult> {
  return adminAction("schools:manage", async (user) => {
    const id = str(fd, "id");
    const status = str(fd, "status");
    if (!["NEW", "CONTACTED", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(status)) throw new OpsError("Invalid status.");
    const p = await db.schoolPartnership.findUniqueOrThrow({ where: { id } });
    await db.$transaction(async (tx) => {
      let schoolId = p.schoolId;
      if (status === "APPROVED" && !schoolId) {
        const school = await tx.school.create({
          data: { name: p.schoolName, board: p.board, address: p.address, city: p.city, state: p.state, isOfficialPartner: true },
        });
        schoolId = school.id;
      } else if (schoolId) {
        await tx.school.update({ where: { id: schoolId }, data: { isOfficialPartner: status === "APPROVED" } });
      }
      await tx.schoolPartnership.update({
        where: { id },
        data: { status: status as "NEW", internalNotes: optStr(fd, "internalNotes"), schoolId },
      });
    });
    await audit({ actorId: user.id, action: "school_partnership.status_changed", entityType: "SchoolPartnership", entityId: id, metadata: { from: p.status, to: status } });
    revalidatePath("/admin/schools");
    return status === "APPROVED" ? "Approved — the school is now recorded as an official partner." : "Partnership updated.";
  });
}

// ── Enquiries ───────────────────────────────────────────────

export async function updateEnquiryStatus(fd: FormData): Promise<ActionResult> {
  return adminAction("enquiries:manage", async (user) => {
    const id = str(fd, "id");
    const status = str(fd, "status");
    if (!["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"].includes(status)) throw new OpsError("Invalid status.");
    await db.enquiry.update({ where: { id }, data: { status: status as "NEW" } });
    await audit({ actorId: user.id, action: "enquiry.status_changed", entityType: "Enquiry", entityId: id, metadata: { status } });
    revalidatePath("/admin/enquiries");
    return "Enquiry updated.";
  });
}

// ── Payments ────────────────────────────────────────────────

export async function refundPaymentAction(fd: FormData): Promise<ActionResult> {
  return adminAction("payments:refund", async (user) => {
    const cfg = razorpayConfig();
    if (!cfg.ok) throw new OpsError(cfg.reason);
    const payment = await db.payment.findUniqueOrThrow({ where: { id: str(fd, "paymentId") }, include: { refunds: true } });
    if (payment.status !== "CAPTURED" && payment.status !== "PARTIALLY_REFUNDED") throw new OpsError("Only captured payments can be refunded.");
    const reason = str(fd, "reason");
    if (reason.length < 5) throw new OpsError("Give a reason for the refund.");
    const already = payment.refunds.filter((r) => r.status !== "FAILED").reduce((s, r) => s + r.amountPaise, 0);
    const amount = rupeesToPaise(fd, "amount")!;
    if (amount <= 0 || amount + already > payment.amountPaise) throw new OpsError("Refund amount exceeds the refundable balance.");

    const refund = await db.refund.create({ data: { paymentId: payment.id, amountPaise: amount, reason, createdById: user.id } });
    try {
      const r = await razorpay().payments.refund(payment.razorpayPaymentId, { amount, notes: { refundId: refund.id } });
      await db.refund.update({ where: { id: refund.id }, data: { razorpayRefundId: r.id, status: r.status === "processed" ? "PROCESSED" : "PENDING" } });
    } catch {
      await db.refund.update({ where: { id: refund.id }, data: { status: "FAILED" } });
      throw new OpsError("The payment gateway rejected the refund. No money was moved.");
    }
    await audit({ actorId: user.id, action: "payment.refund_initiated", entityType: "Payment", entityId: payment.id, metadata: { amountPaise: amount } });
    revalidatePath("/admin/payments");
    return "Refund initiated. Status will update when Razorpay confirms it.";
  });
}

// ── Settings ────────────────────────────────────────────────

export async function updateAnnouncement(fd: FormData): Promise<ActionResult> {
  return adminAction("settings:manage", async (user) => {
    const text = str(fd, "text");
    if (text.length < 5 || text.length > 160) throw new OpsError("Announcement must be 5–160 characters.");
    await db.siteSetting.upsert({
      where: { key: "announcement" },
      create: { key: "announcement", value: { text, enabled: bool(fd, "enabled") }, updatedById: user.id },
      update: { value: { text, enabled: bool(fd, "enabled") }, updatedById: user.id },
    });
    await audit({ actorId: user.id, action: "settings.announcement_updated", entityType: "SiteSetting", entityId: "announcement" });
    revalidatePath("/", "layout");
    return "Announcement updated.";
  });
}

export async function createStaffUser(fd: FormData): Promise<ActionResult> {
  return adminAction("users:manage", async (user) => {
    const role = str(fd, "role");
    if (!ROLES.includes(role as (typeof ROLES)[number]) || role === "GUARDIAN") throw new OpsError("Choose a staff role.");
    const email = emailSchema.parse(str(fd, "email"));
    const name = personName("Name").parse(str(fd, "name"));
    const password = str(fd, "password");
    if (password.length < 12) throw new OpsError("Temporary password must be at least 12 characters.");
    const created = await db.user.create({
      data: { email, name, role: role as "EXAM_ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    });
    await audit({ actorId: user.id, action: "user.staff_created", entityType: "User", entityId: created.id, metadata: { role } });
    revalidatePath("/admin/settings");
    return `Staff account created for ${email}. Share the temporary password securely.`;
  });
}

export async function setUserActive(fd: FormData): Promise<ActionResult> {
  return adminAction("users:manage", async (user) => {
    const id = str(fd, "id");
    if (id === user.id) throw new OpsError("You cannot deactivate your own account.");
    const active = str(fd, "active") === "true";
    await db.user.update({ where: { id }, data: { isActive: active } });
    await audit({ actorId: user.id, action: active ? "user.activated" : "user.deactivated", entityType: "User", entityId: id });
    revalidatePath("/admin/settings");
    return active ? "Account activated." : "Account deactivated. The user is signed out on their next request.";
  });
}
