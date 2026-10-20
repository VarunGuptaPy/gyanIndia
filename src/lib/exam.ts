import "server-only";
import { cache } from "react";
import { db } from "./db";

export const CURRENT_EXAM_SLUG = "nthe-2026";

export const getCurrentExam = cache(async () => {
  return db.examination.findUnique({
    where: { slug: CURRENT_EXAM_SLUG },
    include: {
      subjects: {
        include: { subject: true },
        orderBy: { subject: { sortOrder: "asc" } },
      },
      awardCategories: { orderBy: { sortOrder: "asc" } },
    },
  });
});

export type CurrentExam = NonNullable<Awaited<ReturnType<typeof getCurrentExam>>>;

export function availableSubjects(exam: CurrentExam) {
  return exam.subjects.filter((s) => s.isAvailable);
}

export function paymentsConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Registration is open only when an administrator has enabled it. */
export function isRegistrationOpen(exam: Pick<CurrentExam, "registrationOpen" | "registrationDeadline"> | null) {
  if (!exam?.registrationOpen) return false;
  if (exam.registrationDeadline && exam.registrationDeadline < new Date()) return false;
  return true;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.siteSetting.findUnique({ where: { key } });
  return (row?.value as T) ?? fallback;
}
