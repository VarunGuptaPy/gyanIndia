import Link from "next/link";
import { Award, CalendarDays, Download, FileBadge, HelpCircle, Mail, Phone, Plus, Receipt, School, ScrollText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { RegistrationStatusBadge } from "@/components/student/status";
import { CancelPendingButton, PayNowButton } from "@/components/student/registration-actions";
import { requireGuardian } from "@/lib/session";
import { guardianRegistrations, capturedPayment } from "@/server/student";
import { getCurrentExam, isRegistrationOpen, paymentsConfigured } from "@/lib/exam";
import { formatPaise } from "@/lib/fees";
import { formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { guardian } = await requireGuardian();
  const [regs, exam] = await Promise.all([guardianRegistrations(guardian.id), getCurrentExam()]);
  const open = isRegistrationOpen(exam);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">My registrations</h2>
          {open && (
            <Button asChild size="sm" variant="outline"><Link href="/register"><Plus aria-hidden /> Register another child</Link></Button>
          )}
        </div>

        {regs.length === 0 && (
          <Card>
            <CardBody className="py-14 text-center">
              <UserRound className="mx-auto size-10 text-muted" aria-hidden />
              <p className="mt-4 font-semibold text-navy">No registrations yet</p>
              <p className="mt-1 text-sm text-muted">Register your child for NTHE 2026 to see their details here.</p>
              {open && <Button asChild className="mt-6"><Link href="/register">Register now</Link></Button>}
            </CardBody>
          </Card>
        )}

        {regs.map((r) => {
          const payment = capturedPayment(r);
          const confirmed = r.status === "CONFIRMED";
          const admitReady = confirmed && r.admitCard?.status === "RELEASED" && r.examination.admitCardsReleased;
          return (
            <Card key={r.id} className="overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-line bg-white px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold">{r.student.fullName}</h3>
                    <RegistrationStatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span>Class {r.student.classGrade}</span>
                    <span className="inline-flex items-center gap-1"><School className="size-3.5" aria-hidden />{r.student.schoolName}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold tracking-wider text-muted uppercase">Registration no.</p>
                  {r.registrationNumber ? <p className="font-mono text-lg font-bold text-navy">{r.registrationNumber}</p> : <p className="text-sm font-medium text-muted">Assigned after payment</p>}
                </div>
              </div>
              <CardBody className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-muted uppercase">Subjects</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {r.subjects.map((s) => <li key={s.id}><Badge tone="royal">{s.examSubject.subject.name}</Badge></li>)}
                  </ul>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div><dt className="text-muted">Examination</dt><dd className="font-semibold text-navy">{r.examination.shortName}</dd></div>
                  <div><dt className="text-muted">Exam date</dt><dd className="inline-flex items-center gap-1 font-semibold text-navy"><CalendarDays className="size-3.5" aria-hidden />{formatDate(r.examination.examDate)}</dd></div>
                  <div><dt className="text-muted">Payment</dt><dd className="font-semibold text-navy">{payment ? `${formatPaise(payment.amountPaise)} paid` : r.status === "PENDING_PAYMENT" ? `${formatPaise(r.totalPaise)} due` : "—"}</dd></div>
                  <div><dt className="text-muted">Admit card</dt><dd className="font-semibold text-navy">{admitReady ? "Available" : confirmed ? "Not yet released" : "After payment"}</dd></div>
                  <div><dt className="text-muted">Results</dt><dd className="font-semibold text-navy">{r.examination.resultsPublished && confirmed ? "Published" : "Not yet published"}</dd></div>
                  <div><dt className="text-muted">Certificates</dt><dd className="font-semibold text-navy">{r.certificates.length || "None yet"}</dd></div>
                </dl>
              </CardBody>
              <div className="flex flex-wrap items-center gap-2 border-t border-line bg-paper/60 px-5 py-4 sm:px-6">
                {r.status === "PENDING_PAYMENT" && (
                  <>
                    <PayNowButton registrationId={r.id} amountLabel={formatPaise(r.totalPaise)} />
                    <CancelPendingButton registrationId={r.id} />
                  </>
                )}
                {payment && confirmed && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`/api/student/receipt/${r.id}`}><Receipt aria-hidden /> Payment receipt</a>
                  </Button>
                )}
                {admitReady && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`/api/student/admit-card/${r.id}`}><Download aria-hidden /> Admit card</a>
                  </Button>
                )}
                {confirmed && r.examination.resultsPublished && (
                  <Button asChild size="sm" variant="outline"><Link href="/student/results"><Award aria-hidden /> View results</Link></Button>
                )}
                {r.certificates.length > 0 && (
                  <Button asChild size="sm" variant="outline"><Link href="/student/certificates"><ScrollText aria-hidden /> Certificates</Link></Button>
                )}
              </div>
            </Card>
          );
        })}

        {regs.some((r) => r.status === "PENDING_PAYMENT") && !paymentsConfigured() && (
          <Alert tone="warning" title="Online payments are not enabled yet">
            Your registration details are saved. You will be able to complete payment here once GYAN enables online
            payments — we will notify you by email where possible.
          </Alert>
        )}
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p className="flex items-center gap-2"><UserRound className="size-4 text-muted" aria-hidden /> {guardian.fullName}</p>
            <p className="flex items-center gap-2 break-all"><Mail className="size-4 shrink-0 text-muted" aria-hidden /> {guardian.email}</p>
            <p className="flex items-center gap-2"><Phone className="size-4 text-muted" aria-hidden /> {guardian.mobile}</p>
            <p className="pt-2 text-xs text-muted">To change these details, contact support. Forgot your password? <Link href="/forgot-password" className="text-royal underline">Reset it</Link>.</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Support</CardTitle></CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p className="text-muted">Need help with a registration, payment or admit card?</p>
            <p><a href={SITE.phoneHref} className="font-semibold text-royal">{SITE.phone}</a></p>
            <p><a href={`mailto:${SITE.enquiryEmail}`} className="font-semibold text-royal">{SITE.enquiryEmail}</a></p>
            <Button asChild variant="outline" size="sm" className="mt-2"><Link href="/contact"><HelpCircle aria-hidden /> Contact form</Link></Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Your data</CardTitle></CardHeader>
          <CardBody className="text-sm text-muted">
            Your child&apos;s details are visible only to you and authorised GYAN staff. Read our{" "}
            <Link href="/child-data-protection" className="text-royal underline">child data protection</Link> commitments.
          </CardBody>
        </Card>
        <div className="rounded-[var(--radius-xl)] bg-navy p-5 text-white">
          <FileBadge className="size-6 text-gold" aria-hidden />
          <p className="mt-3 font-semibold">Admit cards</p>
          <p className="mt-1 text-sm text-white/70">Admit cards will be released here once examination centres and reporting times are finalised.</p>
        </div>
      </aside>
    </div>
  );
}
