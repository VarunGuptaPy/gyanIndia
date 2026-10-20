import "server-only";
import { Resend } from "resend";
import { SITE } from "./site";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

type Mail = { to: string; subject: string; text: string; html?: string };

/**
 * Sends a transactional email via Resend. When email is not configured the
 * message is NOT sent and only the subject is logged (never the body or address).
 */
export async function sendEmail(mail: Mail): Promise<{ sent: boolean }> {
  if (!emailConfigured()) {
    console.info(`[email] Not configured — skipped: "${mail.subject}"`);
    return { sent: false };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html ?? textToHtml(mail.text),
      replyTo: SITE.enquiryEmail,
    });
    if (error) {
      console.error(`[email] Provider error for "${mail.subject}": ${error.name}`);
      return { sent: false };
    }
    return { sent: true };
  } catch {
    console.error(`[email] Failed to send "${mail.subject}"`);
    return { sent: false };
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function textToHtml(text: string) {
  const body = escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:Inter,Arial,sans-serif;color:#172033;font-size:15px;line-height:1.6;max-width:560px">
<div style="border-bottom:3px solid #D4A83F;padding-bottom:10px;margin-bottom:20px;font-weight:800;color:#0B1F3A;font-size:20px;letter-spacing:.06em">GYAN</div>
${body}
<p style="margin-top:28px;color:#64748B;font-size:12px">${escapeHtml(SITE.name)} · ${SITE.displayUrl} · ${SITE.phone}</p></div>`;
}

export function registrationConfirmationEmail(p: {
  guardianName: string;
  studentFirstName: string;
  registrationNumber: string;
  examName: string;
  subjects: string[];
  totalFormatted: string;
}): Pick<Mail, "subject" | "text"> {
  return {
    subject: `Registration confirmed — ${p.examName} (${p.registrationNumber})`,
    text: `Dear ${p.guardianName},

Thank you. ${p.studentFirstName}'s registration for ${p.examName} is confirmed.

Registration number: ${p.registrationNumber}
Subjects: ${p.subjects.join(", ")}
Amount paid: ${p.totalFormatted}

You can view the registration, download the payment receipt and — once released — the admit card from your dashboard: ${SITE.url}/student/dashboard

Please keep this registration number safe. For any help, write to ${SITE.enquiryEmail} or call ${SITE.phone}.

Warm regards,
Team GYAN`,
  };
}
