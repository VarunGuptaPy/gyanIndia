import { PageSizes, PDFDocument, degrees, rgb } from "pdf-lib";
import { C, centerText, drawDocHeader, drawEmblem, drawFooter, drawKeyValues, loadFonts, pdfSafe, qrPng, wrapText } from "./common";

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(d);
const inr = (paise: number) => `Rs. ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// ── Payment receipt ─────────────────────────────────────────

export type ReceiptData = {
  registrationNumber: string;
  examName: string;
  studentName: string;
  classGrade: number;
  guardianName: string;
  lines: { label: string; paise: number }[];
  totalPaise: number;
  paymentId: string;
  orderId: string;
  method: string | null;
  paidAt: Date;
};

export async function renderReceipt(d: ReceiptData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Payment receipt ${d.registrationNumber}`);
  doc.setAuthor("GYAN — Global Young Achievers Network");
  const fonts = await loadFonts(doc);
  const page = doc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  drawDocHeader(page, fonts, "PAYMENT RECEIPT", d.examName);

  let y = height - 135;
  page.drawText("Received with thanks", { x: 40, y, size: 16, font: fonts.bold, color: C.navy });
  y -= 18;
  page.drawText(pdfSafe(`Receipt for registration ${d.registrationNumber}`), { x: 40, y, size: 10, font: fonts.regular, color: C.muted });

  y = drawKeyValues(page, fonts, [
    ["Registration number", d.registrationNumber],
    ["Student", d.studentName],
    ["Class", `Class ${d.classGrade}`],
    ["Paid by", d.guardianName],
    ["Payment date", fmtDate(d.paidAt)],
    ["Payment ID", d.paymentId],
    ["Order ID", d.orderId],
    ["Method", d.method ? d.method.toUpperCase() : "-"],
  ], 40, y - 22, width - 80);

  y -= 40;
  page.drawText("Fee details", { x: 40, y, size: 12, font: fonts.bold, color: C.navy });
  y -= 10;
  d.lines.forEach((l) => {
    y -= 22;
    page.drawText(pdfSafe(l.label), { x: 50, y, size: 10, font: fonts.regular, color: C.ink });
    const t = inr(l.paise);
    page.drawText(t, { x: width - 50 - fonts.regular.widthOfTextAtSize(t, 10), y, size: 10, font: fonts.regular, color: C.ink });
    page.drawLine({ start: { x: 40, y: y - 8 }, end: { x: width - 40, y: y - 8 }, thickness: 0.5, color: C.line });
  });
  y -= 36;
  page.drawRectangle({ x: 40, y: y - 10, width: width - 80, height: 34, color: C.cream });
  page.drawText("Total paid", { x: 50, y: y + 2, size: 12, font: fonts.bold, color: C.navy });
  const total = inr(d.totalPaise);
  page.drawText(total, { x: width - 50 - fonts.bold.widthOfTextAtSize(total, 14), y: y + 1, size: 14, font: fonts.bold, color: C.navy });

  drawFooter(page, fonts, "This is a computer-generated receipt for a payment verified with the payment gateway and does not require a signature.");
  return doc.save();
}

// ── Admit card ──────────────────────────────────────────────

export type AdmitCardData = {
  admitCardNumber: string;
  registrationNumber: string;
  examName: string;
  examDate: Date | null;
  studentName: string;
  classGrade: number;
  examLanguage: string;
  subjects: string[];
  centreName: string;
  centreAddress: string;
  reportingTime: string;
  instructions: string[];
  verifyUrl: string;
};

export async function renderAdmitCard(d: AdmitCardData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Admit card ${d.admitCardNumber}`);
  doc.setAuthor("GYAN — Global Young Achievers Network");
  const fonts = await loadFonts(doc);
  const page = doc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  drawDocHeader(page, fonts, "ADMIT CARD", d.examName);

  let y = height - 130;
  page.drawText(pdfSafe(d.examName), { x: 40, y, size: 16, font: fonts.bold, color: C.navy });
  y -= 16;
  page.drawText(`Admit card no. ${d.admitCardNumber}`, { x: 40, y, size: 10, font: fonts.regular, color: C.muted });

  const tableTop = y - 40;
  const qr = await qrPng(doc, d.verifyUrl);
  page.drawImage(qr, { x: width - 136, y: tableTop - 96, width: 96, height: 96 });
  page.drawText("Scan to verify", { x: width - 124, y: tableTop - 110, size: 7.5, font: fonts.regular, color: C.muted });

  y = drawKeyValues(page, fonts, [
    ["Candidate name", d.studentName],
    ["Registration number", d.registrationNumber],
    ["Class", `Class ${d.classGrade}`],
    ["Examination language", d.examLanguage],
    ["Examination date", d.examDate ? fmtDate(d.examDate) : "To be announced"],
    ["Reporting time", d.reportingTime],
  ], 40, tableTop, width - 196, 160);

  y -= 30;
  page.drawText("Subjects", { x: 40, y, size: 12, font: fonts.bold, color: C.navy });
  y -= 20;
  page.drawText(pdfSafe(d.subjects.join("  |  ")), { x: 40, y, size: 10, font: fonts.regular, color: C.ink, maxWidth: width - 80 });

  y -= 32;
  page.drawRectangle({ x: 40, y: y - 52, width: width - 80, height: 66, color: C.cream, borderColor: C.gold, borderWidth: 0.8 });
  page.drawText("Examination centre", { x: 52, y: y - 2, size: 9, font: fonts.regular, color: C.goldDark });
  page.drawText(pdfSafe(d.centreName), { x: 52, y: y - 20, size: 12, font: fonts.bold, color: C.navy });
  wrapText(d.centreAddress, fonts.regular, 9.5, width - 110).slice(0, 2).forEach((line, i) => {
    page.drawText(line, { x: 52, y: y - 36 - i * 12, size: 9.5, font: fonts.regular, color: C.ink });
  });

  y -= 86;
  page.drawText("Instructions", { x: 40, y, size: 12, font: fonts.bold, color: C.navy });
  y -= 6;
  d.instructions.forEach((ins, i) => {
    wrapText(`${i + 1}. ${ins}`, fonts.regular, 9.5, width - 90).forEach((line) => {
      y -= 14;
      if (y > 80) page.drawText(line, { x: 46, y, size: 9.5, font: fonts.regular, color: C.ink });
    });
  });

  // Signature boxes
  const boxY = 80;
  page.drawLine({ start: { x: 40, y: boxY + 20 }, end: { x: 200, y: boxY + 20 }, thickness: 0.6, color: C.muted });
  page.drawText("Candidate's signature", { x: 40, y: boxY + 8, size: 8, font: fonts.regular, color: C.muted });
  page.drawLine({ start: { x: width - 200, y: boxY + 20 }, end: { x: width - 40, y: boxY + 20 }, thickness: 0.6, color: C.muted });
  page.drawText("Invigilator's signature", { x: width - 200, y: boxY + 8, size: 8, font: fonts.regular, color: C.muted });

  drawFooter(page, fonts, "This admit card is valid only for the candidate named above and must be presented at the examination centre.");
  return doc.save();
}

// ── Certificate ─────────────────────────────────────────────

export type CertificateData = {
  certificateNumber: string;
  type: "PARTICIPATION" | "MERIT" | "NATIONAL_RANK";
  studentName: string;
  achievement: string;
  subjectName: string | null;
  rank: number | null;
  examName: string;
  examYear: number;
  issuedAt: Date;
  verifyUrl: string;
  revoked: boolean;
};

const CERT_TITLES = {
  PARTICIPATION: "Certificate of Participation",
  MERIT: "Certificate of Merit",
  NATIONAL_RANK: "Certificate of National Achievement",
};

export async function renderCertificate(d: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${CERT_TITLES[d.type]} ${d.certificateNumber}`);
  doc.setAuthor("GYAN — Global Young Achievers Network");
  const fonts = await loadFonts(doc);
  const page = doc.addPage([PageSizes.A4[1], PageSizes.A4[0]]);
  const { width, height } = page.getSize();

  page.drawRectangle({ x: 0, y: 0, width, height, color: C.cream });
  page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: C.navy, borderWidth: 3 });
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: C.gold, borderWidth: 1.2 });
  // Corner ornaments
  for (const [cx, cy] of [[28, 28], [width - 28, 28], [28, height - 28], [width - 28, height - 28]]) {
    page.drawSquare({ x: cx - 6, y: cy - 6, size: 12, color: C.gold, rotate: degrees(0) });
  }
  // Watermark emblem
  drawEmblem(page, width / 2 - 140, height / 2 - 150, 280, rgb(0.95, 0.92, 0.85), rgb(0.96, 0.93, 0.86));

  drawEmblem(page, width / 2 - 26, height - 118, 52, C.navy);
  centerText(page, "GLOBAL YOUNG ACHIEVERS NETWORK", height - 136, fonts.bold, 9, C.goldDark);

  centerText(page, CERT_TITLES[d.type].toUpperCase(), height - 180, fonts.serifBold, 26, C.navy);
  page.drawLine({ start: { x: width / 2 - 60, y: height - 194 }, end: { x: width / 2 + 60, y: height - 194 }, thickness: 1.5, color: C.gold });

  centerText(page, "This is to certify that", height - 228, fonts.serifItalic, 14, C.muted);
  const nameSize = Math.min(34, (width - 200) / Math.max(1, fonts.serifBold.widthOfTextAtSize(pdfSafe(d.studentName), 1)));
  centerText(page, d.studentName, height - 272, fonts.serifBold, nameSize, C.navy);
  page.drawLine({ start: { x: width / 2 - 180, y: height - 284 }, end: { x: width / 2 + 180, y: height - 284 }, thickness: 0.6, color: C.goldDark });

  const body = [
    d.achievement,
    d.subjectName ? `in ${d.subjectName}` : null,
    d.rank ? `securing National Rank ${d.rank}` : null,
    `in the ${d.examName}.`,
  ].filter(Boolean).join(" ");
  wrapText(body, fonts.serif, 14, width - 240).forEach((line, i) => centerText(page, line, height - 314 - i * 20, fonts.serif, 14, C.ink));

  // Footer: date, signature, QR
  const fy = 92;
  page.drawText(`Date of issue: ${fmtDate(d.issuedAt)}`, { x: 80, y: fy + 24, size: 10, font: fonts.regular, color: C.ink });
  page.drawText(`Certificate No.: ${d.certificateNumber}`, { x: 80, y: fy + 8, size: 10, font: fonts.bold, color: C.navy });
  page.drawLine({ start: { x: width / 2 - 90, y: fy + 30 }, end: { x: width / 2 + 90, y: fy + 30 }, thickness: 0.6, color: C.ink });
  centerText(page, "Authorised Signatory, GYAN", fy + 16, fonts.regular, 9, C.muted);
  const qr = await qrPng(doc, d.verifyUrl);
  page.drawImage(qr, { x: width - 160, y: fy - 10, width: 76, height: 76 });
  page.drawText("Verify at gyanindia.com", { x: width - 170, y: fy - 22, size: 7, font: fonts.regular, color: C.muted });

  if (d.revoked) {
    page.drawText("REVOKED", { x: width / 2 - 170, y: height / 2 - 40, size: 90, font: fonts.bold, color: rgb(0.7, 0.14, 0.1), opacity: 0.25, rotate: degrees(20) });
  }
  return doc.save();
}
