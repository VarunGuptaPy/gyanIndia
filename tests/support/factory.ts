import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { SUBJECT_CONTENT } from "@/content/subjects";

/** Empties all tables and seeds the examination configuration used by tests. */
export async function resetDb() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);

  const exam = await db.examination.create({
    data: {
      slug: "nthe-2026",
      name: "National Talent Hunt Examination 2026",
      shortName: "NTHE 2026",
      year: 2026,
      examDate: new Date("2026-12-12T00:00:00+05:30"),
      languages: ["English", "Hindi"],
      registrationFeePaise: 5000,
      registrationOpen: true,
      boards: ["CBSE", "ICSE", "UP Board"],
    },
  });
  const subjects = [];
  for (const [i, s] of SUBJECT_CONTENT.entries()) {
    const subject = await db.subject.create({
      data: { slug: s.slug, name: s.name, nameHi: s.nameHi, shortDescription: s.short, icon: s.icon, sortOrder: i },
    });
    subjects.push(await db.examSubject.create({ data: { examinationId: exam.id, subjectId: subject.id, feePaise: 25000, maxMarks: 100 } }));
  }
  return { exam, subjects };
}

export function registrationInput(subjectIds: string[], overrides: Record<string, unknown> = {}) {
  return {
    student: {
      fullName: "Test Student",
      classGrade: 6,
      board: "CBSE",
      schoolName: "Test School",
      city: "Lucknow",
      state: "Uttar Pradesh",
      examLanguage: "ENGLISH",
    },
    guardian: { fullName: "Test Guardian", mobile: "9876543210", email: `g-${randomUUID()}@example.com`, address: "" },
    password: "TestPassword123",
    subjectIds,
    consent: { isGuardian: true, dataProcessing: true, terms: true },
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

export const ctx = { ipHash: "test-ip", userAgent: "vitest" };
