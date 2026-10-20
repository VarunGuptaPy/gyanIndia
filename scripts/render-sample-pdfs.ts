// Renders sample PDFs with obviously fictional data for visual review of the templates.
//   npx tsx scripts/render-sample-pdfs.ts <output-dir>
import { writeFileSync } from "node:fs";
import path from "node:path";
import { renderAdmitCard, renderCertificate, renderReceipt } from "../src/lib/pdf/documents";

const out = process.argv[2] ?? ".";
const now = new Date("2026-12-20T10:00:00+05:30");

async function main() {
  writeFileSync(path.join(out, "sample-receipt.pdf"), await renderReceipt({
    registrationNumber: "NTHE26-000001", examName: "National Talent Hunt Examination 2026", studentName: "Sample Student",
    classGrade: 6, guardianName: "Sample Guardian", lines: [{ label: "Registration fee (one-time)", paise: 5000 }, { label: "Subject: Mathematics", paise: 25000 }, { label: "Subject: Science", paise: 25000 }],
    totalPaise: 55000, paymentId: "pay_SAMPLE0001", orderId: "order_SAMPLE0001", method: "upi", paidAt: now,
  }));
  writeFileSync(path.join(out, "sample-admit-card.pdf"), await renderAdmitCard({
    admitCardNumber: "NTHE26-AC-000001", registrationNumber: "NTHE26-000001", examName: "National Talent Hunt Examination 2026",
    examDate: new Date("2026-12-12T00:00:00+05:30"), studentName: "Sample Student", classGrade: 6, examLanguage: "English",
    subjects: ["Mathematics", "Science"], centreName: "Sample Examination Centre", centreAddress: "Sample Road, Sample City, Sample State",
    reportingTime: "SAMPLE TIME", instructions: ["Sample instruction one (replace with approved instructions).", "Sample instruction two."],
    verifyUrl: "http://localhost:3000/verify/admit-card?code=SAMPLE2345",
  }));
  writeFileSync(path.join(out, "sample-certificate.pdf"), await renderCertificate({
    certificateNumber: "GYAN-C26-SAMPLE23", type: "NATIONAL_RANK", studentName: "Sample Student", achievement: "has achieved outstanding distinction",
    subjectName: "Mathematics", rank: 1, examName: "National Talent Hunt Examination 2026", examYear: 2026, issuedAt: now,
    verifyUrl: "http://localhost:3000/certificate/verify?id=GYAN-C26-SAMPLE23", revoked: false,
  }));
  console.log("Wrote sample PDFs to", out);
}
main();
