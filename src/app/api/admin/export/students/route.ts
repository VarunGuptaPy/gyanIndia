import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertPermission, AuthorizationError } from "@/lib/session";
import { audit } from "@/lib/audit";
import { studentWhere } from "@/server/admin-queries";

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(req: Request) {
  let user;
  try {
    user = await assertPermission("students:export");
  } catch (e) {
    if (e instanceof AuthorizationError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const rows = await db.student.findMany({
    where: studentWhere(sp),
    include: {
      registrations: { include: { subjects: { include: { examSubject: { include: { subject: true } } } } } },
      guardian: true,
    },
    orderBy: { createdAt: "asc" },
    take: 50_000,
  });
  const header = ["registration_number", "status", "student_name", "class", "board", "school", "city", "state", "exam_language", "subjects", "guardian_name", "guardian_mobile", "guardian_email"];
  const lines = [header.join(",")];
  for (const s of rows) {
    for (const r of s.registrations.length ? s.registrations : [null]) {
      lines.push([
        r?.registrationNumber, r?.status, s.fullName, s.classGrade, s.board, s.schoolName, s.city, s.state, s.examLanguage,
        r?.subjects.map((x) => x.examSubject.subject.name).join("; "), s.guardian.fullName, s.guardian.mobile, s.guardian.email,
      ].map(esc).join(","));
    }
  }
  await audit({ actorId: user.id, action: "students.exported", entityType: "Student", metadata: { rows: rows.length, filters: sp } });
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gyan-students-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
