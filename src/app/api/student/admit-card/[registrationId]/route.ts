import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { ownedRegistration } from "@/server/student";
import { renderAdmitCard } from "@/lib/pdf/documents";
import { admitCardInstructions } from "@/server/exam-ops";
import { SITE } from "@/lib/site";

export async function GET(_req: Request, { params }: { params: Promise<{ registrationId: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { registrationId } = await params;
  const reg = await ownedRegistration(registrationId, user.id);
  if (!reg) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const card = reg.admitCard;
  if (reg.status !== "CONFIRMED" || !card || card.status !== "RELEASED" || !reg.examination.admitCardsReleased) {
    return NextResponse.json({ error: "The admit card has not been released yet." }, { status: 409 });
  }
  const pdf = await renderAdmitCard({
    admitCardNumber: card.admitCardNumber,
    registrationNumber: reg.registrationNumber!,
    examName: reg.examination.name,
    examDate: reg.examination.examDate,
    studentName: reg.student.fullName,
    classGrade: reg.student.classGrade,
    examLanguage: reg.student.examLanguage === "HINDI" ? "Hindi" : "English",
    subjects: reg.subjects.map((s) => s.examSubject.subject.name),
    centreName: card.centreName,
    centreAddress: card.centreAddress,
    reportingTime: card.reportingTime,
    instructions: admitCardInstructions(reg.examination.examDayInstructions),
    verifyUrl: `${SITE.url}/verify/admit-card?code=${card.verificationCode}`,
  });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="GYAN-admit-card-${card.admitCardNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
