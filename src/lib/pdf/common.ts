import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts, type RGB } from "pdf-lib";
import QRCode from "qrcode";

export const C = {
  navy: rgb(11 / 255, 31 / 255, 58 / 255),
  royal: rgb(23 / 255, 78 / 255, 166 / 255),
  gold: rgb(212 / 255, 168 / 255, 63 / 255),
  goldDark: rgb(143 / 255, 107 / 255, 25 / 255),
  ink: rgb(23 / 255, 32 / 255, 51 / 255),
  muted: rgb(100 / 255, 116 / 255, 139 / 255),
  line: rgb(227 / 255, 232 / 255, 239 / 255),
  paper: rgb(247 / 255, 249 / 255, 252 / 255),
  cream: rgb(252 / 255, 248 / 255, 238 / 255),
  white: rgb(1, 1, 1),
};

export type Fonts = { regular: PDFFont; bold: PDFFont; serif: PDFFont; serifBold: PDFFont; serifItalic: PDFFont };

export async function loadFonts(doc: PDFDocument): Promise<Fonts> {
  return {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    serifItalic: await doc.embedFont(StandardFonts.TimesRomanItalic),
  };
}

/** Standard PDF fonts only support WinAnsi; replace anything else so generation never fails. */
export function pdfSafe(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/₹/g, "Rs. ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

/** Draws the placeholder GYAN emblem (book + star) at x,y (bottom-left) with the given size. */
export function drawEmblem(page: PDFPage, x: number, y: number, size: number, ink: RGB = C.navy, star: RGB = C.gold) {
  const s = size / 40;
  const top = y + size;
  const opts = { x, y: top, scale: s };
  page.drawSvgPath("M20 29.5c-3.6-2.6-8-3.3-12.5-2.4V14.6c4.6-.9 8.9-.1 12.5 2.6z", { ...opts, color: ink });
  page.drawSvgPath("M20 29.5c3.6-2.6 8-3.3 12.5-2.4V14.6c-4.6-.9-8.9-.1-12.5 2.6z", { ...opts, color: ink, opacity: 0.8 });
  page.drawSvgPath("M20 4.8l1.55 3.75L25.3 10.1l-3.75 1.55L20 15.4l-1.55-3.75L14.7 10.1l3.75-1.55z", { ...opts, color: star });
  page.drawCircle({ x: x + 20 * s, y: top - 20 * s, size: 18.75 * s, borderColor: ink, borderWidth: 1.2 * s, opacity: 0, borderOpacity: 0.25 });
}

export async function qrPng(doc: PDFDocument, url: string) {
  const dataUrl = await QRCode.toDataURL(url, { margin: 0, width: 300, color: { dark: "#0B1F3AFF", light: "#FFFFFFFF" } });
  const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
  return doc.embedPng(bytes);
}

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = pdfSafe(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function centerText(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color: RGB = C.ink) {
  const safe = pdfSafe(text);
  const w = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

/** Header band used on receipts and admit cards. */
export function drawDocHeader(page: PDFPage, fonts: Fonts, title: string, subtitle: string) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 92, width, height: 92, color: C.navy });
  page.drawRectangle({ x: 0, y: height - 95, width, height: 3, color: C.gold });
  drawEmblem(page, 40, height - 72, 50, C.white);
  page.drawText("GYAN", { x: 100, y: height - 45, size: 22, font: fonts.bold, color: C.white });
  page.drawText("GLOBAL YOUNG ACHIEVERS NETWORK", { x: 100, y: height - 61, size: 7.5, font: fonts.regular, color: rgb(0.8, 0.84, 0.9) });
  const tw = fonts.bold.widthOfTextAtSize(title, 15);
  page.drawText(title, { x: width - 40 - tw, y: height - 45, size: 15, font: fonts.bold, color: C.gold });
  const sw = fonts.regular.widthOfTextAtSize(subtitle, 9);
  page.drawText(subtitle, { x: width - 40 - sw, y: height - 61, size: 9, font: fonts.regular, color: rgb(0.8, 0.84, 0.9) });
}

export function drawFooter(page: PDFPage, fonts: Fonts, note: string) {
  const { width } = page.getSize();
  page.drawLine({ start: { x: 40, y: 52 }, end: { x: width - 40, y: 52 }, thickness: 0.6, color: C.line });
  page.drawText(pdfSafe(note), { x: 40, y: 38, size: 7.5, font: fonts.regular, color: C.muted });
  const site = "www.gyanindia.com  |  admin@gyanindia.com  |  +91-73 4800 4848";
  page.drawText(site, { x: 40, y: 26, size: 7.5, font: fonts.regular, color: C.muted });
}

/** Two-column key/value table. Returns the y position after the table. */
export function drawKeyValues(
  page: PDFPage,
  fonts: Fonts,
  rows: [string, string][],
  x: number,
  y: number,
  width: number,
  labelWidth = 150,
): number {
  const rowH = 24;
  rows.forEach(([k, v], i) => {
    const ry = y - (i + 1) * rowH;
    if (i % 2 === 0) page.drawRectangle({ x, y: ry, width, height: rowH, color: C.paper });
    page.drawText(pdfSafe(k), { x: x + 10, y: ry + 8, size: 9, font: fonts.regular, color: C.muted });
    page.drawText(pdfSafe(v).slice(0, 90), { x: x + labelWidth, y: ry + 8, size: 10, font: fonts.bold, color: C.ink });
  });
  page.drawRectangle({ x, y: y - rows.length * rowH, width, height: rows.length * rowH, borderColor: C.line, borderWidth: 0.8 });
  return y - rows.length * rowH;
}
