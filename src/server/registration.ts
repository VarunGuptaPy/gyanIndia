import "server-only";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { calculateFees, FeeError } from "@/lib/fees";
import { availableSubjects, getCurrentExam, isRegistrationOpen } from "@/lib/exam";
import { fieldErrors, registrationSchema } from "@/lib/validation";
import { CONSENT_VERSION } from "@/lib/site";
import { sha256Hex } from "@/lib/signatures";
import { CONSENT_TEXT } from "@/content/consent";

export type RegistrationActionResult =
  | { ok: true; registrationId: string; newAccount: boolean; existing?: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; code?: "ACCOUNT_EXISTS" | "DUPLICATE" | "CLOSED" };

type Actor = { id: string; role: string } | null;

const normaliseName = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Creates a guardian account (if needed), student, consent record and a
 * PENDING_PAYMENT registration in a single transaction. Idempotent per idempotencyKey.
 */
export async function createRegistration(
  raw: unknown,
  actor: Actor,
  ctx: { ipHash: string; userAgent: string | null },
): Promise<RegistrationActionResult> {
  const parsed = registrationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  const input = parsed.data;

  if (actor && actor.role !== "GUARDIAN") {
    return { ok: false, error: "Administrator accounts cannot register students. Please sign out first." };
  }

  // Idempotency: a resubmitted request returns the original registration.
  const prior = await db.registration.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true },
  });
  if (prior) return { ok: true, registrationId: prior.id, newAccount: false, existing: true };

  const exam = await getCurrentExam();
  if (!exam || !isRegistrationOpen(exam)) {
    return { ok: false, code: "CLOSED", error: "Registrations for NTHE 2026 are not open at the moment." };
  }

  const { student, guardian } = input;
  if (student.classGrade < exam.eligibleClassMin || student.classGrade > exam.eligibleClassMax) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: { "student.classGrade": `Classes ${exam.eligibleClassMin}–${exam.eligibleClassMax} are eligible.` },
    };
  }
  if (![...exam.boards, "Other"].includes(student.board)) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: { "student.board": "Select a board from the list." } };
  }
  const languageName = student.examLanguage === "HINDI" ? "Hindi" : "English";
  if (!exam.languages.includes(languageName)) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: { "student.examLanguage": "This language is not available." } };
  }

  const subjects = availableSubjects(exam);
  let fees;
  try {
    fees = calculateFees(
      input.subjectIds,
      subjects.map((s) => ({ id: s.id, feePaise: s.feePaise })),
      exam.registrationFeePaise,
    );
  } catch (e) {
    if (e instanceof FeeError) return { ok: false, error: e.message, fieldErrors: { subjectIds: e.message } };
    throw e;
  }

  let userId = actor?.id ?? null;
  let newAccount = false;
  let passwordHash: string | null = null;

  if (!userId) {
    if (!input.password) {
      return { ok: false, error: "Please create a password for the guardian account.", fieldErrors: { password: "Password is required." } };
    }
    const existingUser = await db.user.findUnique({ where: { email: guardian.email }, select: { id: true } });
    if (existingUser) {
      return {
        ok: false,
        code: "ACCOUNT_EXISTS",
        error: "An account already exists with this email. Please log in to register another child.",
        fieldErrors: { "guardian.email": "An account already exists with this email." },
      };
    }
    passwordHash = await bcrypt.hash(input.password, 12);
  }

  try {
    const registrationId = await db.$transaction(async (tx) => {
      let guardianId: string;
      if (userId) {
        const g = await tx.guardian.findUnique({ where: { userId } });
        if (!g) throw new Error("Guardian profile missing.");
        guardianId = g.id;
      } else {
        const user = await tx.user.create({
          data: {
            email: guardian.email,
            passwordHash: passwordHash!,
            name: guardian.fullName,
            role: "GUARDIAN",
            guardian: {
              create: {
                fullName: guardian.fullName,
                mobile: guardian.mobile,
                email: guardian.email,
                address: guardian.address || null,
              },
            },
          },
          include: { guardian: true },
        });
        userId = user.id;
        guardianId = user.guardian!.id;
        newAccount = true;
      }

      // Duplicate registration prevention for the same child under this guardian.
      const siblings = await tx.student.findMany({
        where: { guardianId, classGrade: student.classGrade },
        include: { registrations: { where: { examinationId: exam.id, status: { not: "CANCELLED" } } } },
      });
      const dup = siblings.find(
        (s) => normaliseName(s.fullName) === normaliseName(student.fullName) && s.registrations.length > 0,
      );
      if (dup) throw new DuplicateRegistration();

      const createdStudent = await tx.student.create({
        data: {
          guardianId,
          fullName: student.fullName.replace(/\s+/g, " "),
          classGrade: student.classGrade,
          board: student.board,
          schoolName: student.schoolName,
          city: student.city,
          state: student.state,
          examLanguage: student.examLanguage,
        },
      });

      await tx.consentRecord.create({
        data: {
          guardianId,
          consentVersion: CONSENT_VERSION,
          consentTextHash: sha256Hex(CONSENT_TEXT),
          purpose: `Registration of a child for ${exam.name} (student ${createdStudent.id})`,
          ipHash: ctx.ipHash,
          userAgent: ctx.userAgent,
        },
      });

      const reg = await tx.registration.create({
        data: {
          examinationId: exam.id,
          studentId: createdStudent.id,
          status: "PENDING_PAYMENT",
          registrationFeePaise: fees.registrationFeePaise,
          subjectsFeePaise: fees.subjectsFeePaise,
          totalPaise: fees.totalPaise,
          idempotencyKey: input.idempotencyKey,
          subjects: { create: fees.lines.map((l) => ({ examSubjectId: l.id, feePaise: l.feePaise })) },
        },
      });

      await audit(
        {
          actorId: userId,
          action: "registration.created",
          entityType: "Registration",
          entityId: reg.id,
          metadata: { subjectCount: fees.subjectCount, totalPaise: fees.totalPaise, newAccount },
          ipHash: ctx.ipHash,
        },
        tx,
      );
      return reg.id;
    });

    return { ok: true, registrationId, newAccount };
  } catch (e) {
    if (e instanceof DuplicateRegistration) {
      return {
        ok: false,
        code: "DUPLICATE",
        error: "This student is already registered for NTHE 2026. You can view or complete the registration from your dashboard.",
      };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // A concurrent duplicate submission may have won the race — return its result.
      const again = await db.registration.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (again) return { ok: true, registrationId: again.id, newAccount: false, existing: true };
      const target = String((e.meta as { target?: unknown })?.target ?? "");
      if (target.includes("email")) {
        return { ok: false, code: "ACCOUNT_EXISTS", error: "An account already exists with this email. Please log in." };
      }
    }
    throw e;
  }
}

class DuplicateRegistration extends Error {}

/** Guardian cancels their own unpaid registration so they can start again. */
export async function cancelPendingRegistration(registrationId: string, userId: string) {
  const reg = await db.registration.findUnique({
    where: { id: registrationId },
    include: { student: { include: { guardian: true } }, paymentOrders: { include: { payments: true } } },
  });
  if (!reg || reg.student.guardian.userId !== userId) return { ok: false as const, error: "Registration not found." };
  if (reg.status !== "PENDING_PAYMENT") return { ok: false as const, error: "Only unpaid registrations can be cancelled." };
  if (reg.paymentOrders.some((o) => o.status === "PAID" || o.payments.some((p) => p.status === "CAPTURED"))) {
    return { ok: false as const, error: "A payment has been received for this registration. Please contact support." };
  }
  const updated = await db.registration.updateMany({
    where: { id: reg.id, status: "PENDING_PAYMENT" },
    data: { status: "CANCELLED" },
  });
  if (updated.count === 1) {
    await audit({ actorId: userId, action: "registration.cancelled_by_guardian", entityType: "Registration", entityId: reg.id });
  }
  return { ok: true as const };
}
