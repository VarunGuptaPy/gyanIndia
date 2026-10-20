import "server-only";
import { db } from "@/lib/db";
import { maskName } from "@/lib/format";
import { certificateNumberSchema } from "@/lib/validation";

export type CertificateVerification =
  | { status: "invalid_format" }
  | { status: "not_found" }
  | {
      status: "valid" | "revoked";
      certificateNumber: string;
      studentInitials: string;
      achievement: string;
      subjectName: string | null;
      rank: number | null;
      examName: string;
      examYear: number;
      issuedAt: Date;
      revokedAt: Date | null;
    };

/** Public verification. Returns only the minimum needed to confirm authenticity. */
export async function verifyCertificate(input: string): Promise<CertificateVerification> {
  const parsed = certificateNumberSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid_format" };
  const c = await db.certificate.findUnique({ where: { certificateNumber: parsed.data } });
  if (!c) return { status: "not_found" };
  return {
    status: c.status === "REVOKED" ? "revoked" : "valid",
    certificateNumber: c.certificateNumber,
    studentInitials: maskName(c.studentName),
    achievement: c.achievement,
    subjectName: c.subjectName,
    rank: c.rank,
    examName: c.examName,
    examYear: c.examYear,
    issuedAt: c.issuedAt,
    revokedAt: c.revokedAt,
  };
}

export async function verifyAdmitCard(code: string) {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(clean)) return { status: "invalid_format" as const };
  const card = await db.admitCard.findUnique({
    where: { verificationCode: clean },
    include: { registration: { include: { student: true, examination: true } } },
  });
  if (!card || card.status === "GENERATED") return { status: "not_found" as const };
  return {
    status: card.status === "REVOKED" ? ("revoked" as const) : ("valid" as const),
    admitCardNumber: card.admitCardNumber,
    studentInitials: maskName(card.registration.student.fullName),
    examName: card.registration.examination.name,
    centreName: card.centreName,
  };
}
