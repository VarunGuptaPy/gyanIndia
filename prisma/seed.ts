// Safe seed script.
//
// Always (idempotent, production-safe): examination configuration from the officially
// supplied details, the seven proposed subjects, and UNCONFIRMED award categories.
//
// Development only (refused when NODE_ENV=production): a local super-admin account.
// No student, registration or payment records are ever seeded.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SUBJECT_CONTENT } from "../src/content/subjects";

const db = new PrismaClient();
const isProd = process.env.NODE_ENV === "production";

async function main() {
  const exam = await db.examination.upsert({
    where: { slug: "nthe-2026" },
    update: {},
    create: {
      slug: "nthe-2026",
      name: "National Talent Hunt Examination 2026",
      shortName: "NTHE 2026",
      year: 2026,
      // 12 December 2026, stored as midnight IST.
      examDate: new Date("2026-12-12T00:00:00+05:30"),
      mode: "Offline",
      languages: ["English", "Hindi"],
      registrationFeePaise: 50_00,
      // Registration stays closed in production until an administrator opens it.
      registrationOpen: !isProd,
      eligibleClassMin: 1,
      eligibleClassMax: 10,
      eligibilityApproved: false,
      boards: ["CBSE", "ICSE", "UP Board"],
      boardsApproved: false,
    },
  });

  for (const [i, s] of SUBJECT_CONTENT.entries()) {
    const subject = await db.subject.upsert({
      where: { slug: s.slug },
      update: { name: s.name, nameHi: s.nameHi, shortDescription: s.short, icon: s.icon, sortOrder: i },
      create: { slug: s.slug, name: s.name, nameHi: s.nameHi, shortDescription: s.short, icon: s.icon, sortOrder: i },
    });
    await db.examSubject.upsert({
      where: { examinationId_subjectId: { examinationId: exam.id, subjectId: subject.id } },
      update: {},
      create: { examinationId: exam.id, subjectId: subject.id, feePaise: 250_00, isAvailable: true, isApproved: false },
    });
  }

  if ((await db.awardCategory.count({ where: { examinationId: exam.id } })) === 0) {
    await db.awardCategory.createMany({
      data: [
        { examinationId: exam.id, title: "National Rank 1", rankFrom: 1, rankTo: 1, sortOrder: 1, includesCertificate: true },
        { examinationId: exam.id, title: "National Rank 2", rankFrom: 2, rankTo: 2, sortOrder: 2, includesCertificate: true },
        { examinationId: exam.id, title: "National Rank 3", rankFrom: 3, rankTo: 3, sortOrder: 3, includesCertificate: true },
        { examinationId: exam.id, title: "Other qualifying ranks", rankFrom: 4, rankTo: 10, sortOrder: 4, includesCertificate: true },
      ],
    });
  }

  await db.siteSetting.upsert({
    where: { key: "announcement" },
    update: {},
    create: { key: "announcement", value: { text: "NTHE 2026 | Offline Examination | 12 December 2026", enabled: true } },
  });

  if (!isProd) {
    const email = process.env.DEV_ADMIN_EMAIL ?? "admin@gyan.local";
    const password = process.env.DEV_ADMIN_PASSWORD ?? "GyanDev-Admin-2026";
    await db.user.upsert({
      where: { email },
      update: {},
      create: { email, name: "Development Admin", role: "SUPER_ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    });
    console.log(`Development super admin: ${email} (password from DEV_ADMIN_PASSWORD or the documented default)`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
