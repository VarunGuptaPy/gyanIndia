import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { renderCertificate } from "@/lib/pdf/documents";
import { SITE } from "@/lib/site";

/** Certificate PDF — available to the owning guardian, or to staff with certificate permissions. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id } = await params;
  const cert = await db.certificate.findUnique({
    where: { id },
    include: { registration: { include: { student: { include: { guardian: true } } } } },
  });
  if (!cert) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const isOwner = cert.registration.student.guardian.userId === user.id;
  const isStaff = can(user.role, "certificates:manage");
  if (!isOwner && !isStaff) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (isOwner && !isStaff && cert.status === "REVOKED") {
    return NextResponse.json({ error: "This certificate has been revoked." }, { status: 410 });
  }
  const pdf = await renderCertificate({
    certificateNumber: cert.certificateNumber,
    type: cert.type,
    studentName: cert.studentName,
    achievement: cert.achievement,
    subjectName: cert.subjectName,
    rank: cert.rank,
    examName: cert.examName,
    examYear: cert.examYear,
    issuedAt: cert.issuedAt,
    verifyUrl: `${SITE.url}/certificate/verify?id=${cert.certificateNumber}`,
    revoked: cert.status === "REVOKED",
  });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${cert.certificateNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
