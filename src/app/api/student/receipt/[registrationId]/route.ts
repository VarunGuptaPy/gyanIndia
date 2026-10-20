import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { capturedPayment, ownedRegistration } from "@/server/student";
import { renderReceipt } from "@/lib/pdf/documents";

export async function GET(_req: Request, { params }: { params: Promise<{ registrationId: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { registrationId } = await params;
  const reg = await ownedRegistration(registrationId, user.id);
  if (!reg) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const payment = capturedPayment(reg);
  if (!reg.registrationNumber || !payment) {
    return NextResponse.json({ error: "A receipt is available only after payment is verified." }, { status: 409 });
  }
  const pdf = await renderReceipt({
    registrationNumber: reg.registrationNumber,
    examName: reg.examination.name,
    studentName: reg.student.fullName,
    classGrade: reg.student.classGrade,
    guardianName: reg.student.guardian.fullName,
    lines: [
      { label: "Registration fee (one-time)", paise: reg.registrationFeePaise },
      ...reg.subjects.map((s) => ({ label: `Subject: ${s.examSubject.subject.name}`, paise: s.feePaise })),
    ],
    totalPaise: payment.amountPaise,
    paymentId: payment.razorpayPaymentId,
    orderId: payment.orderId,
    method: payment.method,
    paidAt: payment.capturedAt ?? reg.confirmedAt ?? new Date(),
  });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="GYAN-receipt-${reg.registrationNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
